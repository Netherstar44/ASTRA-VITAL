from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

from backend.ai.anomaly_detection.rules import detect_anomalies
from backend.ai.behavioral.heuristics import behavior_summary
from backend.ai.radiation.forecast import radiation_summary
from backend.alerts.manager import Alert, AlertManager
from backend.communications.dtn import DTNStore
from backend.config.settings import settings
from backend.core.behavior.analyzer import assess_behavior
from backend.core.environment.space_weather import SpaceWeatherState, space_weather_for_step
from backend.core.health.analyzer import assess_health
from backend.core.telemetry.models import CrewState, TelemetryEvent, build_event
from backend.core.telemetry.pipeline import normalize
from backend.risk.engine import RiskEngine
from backend.sensors.simulator import readings_for_step


class MissionSnapshot(BaseModel):
    mission_id: str
    crew_id: str
    step: int = Field(ge=0, le=5)
    phase: str
    phase_title: str
    phase_message: str
    link_status: Literal["live", "buffering", "restored"]
    crew_state: CrewState
    readings: dict[str, float]
    health: dict
    behavior: dict
    environment: SpaceWeatherState
    risk: dict
    alert: dict  # Resolved Alert from AlertManager (severity, HUD symbol, audio, haptic)
    anomalies: list[str]
    telemetry: list[TelemetryEvent]
    dtn: dict
    updated_at: datetime


class MissionService:
    def __init__(self) -> None:
        self.step = 0
        self.relay_enabled = True
        self.store = DTNStore()
        self.risk_engine = RiskEngine()
        self.alert_manager = AlertManager()

    def reset(self) -> MissionSnapshot:
        self.step = 0
        self.relay_enabled = True
        self.store = DTNStore()
        return self.snapshot()

    def advance(self) -> MissionSnapshot:
        self.step = min(5, self.step + 1)
        if self.step == 4:
            self.relay_enabled = False
        if self.step == 5:
            self.relay_enabled = True
            self.store.flush()
        return self.snapshot()

    def set_relay(self, enabled: bool) -> MissionSnapshot:
        self.relay_enabled = enabled
        if enabled:
            self.store.flush()
        return self.snapshot()

    def snapshot(self) -> MissionSnapshot:
        readings = readings_for_step(self.step)
        environment = space_weather_for_step(self.step)
        health = assess_health(readings)
        behavior = assess_behavior(readings)
        risk = self.risk_engine.assess(
            readings=readings,
            environment=environment,
            health_status=health.status,
            behavior_state=behavior.state,
            relay_enabled=self.relay_enabled,
        )
        # FASE 6: Alert Manager resolves risk into a human-centered alert
        alert: Alert = self.alert_manager.resolve(risk, step=self.step)
        crew_state = CrewState(
            physiology=max(0.12, 1 - min(0.88, max(0, readings["heart_rate"] - 72) / 120)),
            behavior=max(0.12, readings["task_accuracy"] - readings["tremor"] * 0.25),
            cognitive_load=min(0.98, 0.38 + self.step * 0.1),
            fatigue=min(0.95, 0.22 + self.step * 0.12),
            environmental_exposure=environment.risk_score,
            radiation_risk=environment.risk_score,
            mission_stress=min(0.92, 0.28 + self.step * 0.11),
        )
        events = normalize(self._telemetry_events(readings, risk["priority"]))
        for event in events:
            if not self.relay_enabled:
                self.store.enqueue(event)
        return MissionSnapshot(
            mission_id=settings.mission_id,
            crew_id=settings.default_crew_id,
            step=self.step,
            phase=self._phase_label(),
            phase_title=self._phase_title(),
            phase_message=self._phase_message(),
            link_status=self._link_status(),
            crew_state=crew_state,
            readings=readings,
            health=health.model_dump(),
            behavior=behavior.model_dump(),
            environment=environment,
            risk=risk,
            alert=alert.model_dump(mode="json"),
            anomalies=detect_anomalies(readings),
            telemetry=events,
            dtn=self.store.summary(),
            updated_at=datetime.now(timezone.utc),
        )

    def assistant_answer(self, role: str, question: str) -> dict[str, str]:
        snapshot = self.snapshot()
        q = question.lower()
        if any(w in q for w in ("radia", "solar", "clima", "tormenta")):
            ans = radiation_summary(snapshot, role)
        elif any(w in q for w in ("comport", "conduct", "fatiga", "cognit", "ritmo", "carga")):
            ans = behavior_summary(snapshot, role)
        elif any(w in q for w in ("anomal", "telemetr", "signo", "pulso", "coraz", "sensor", "spo2")):
            anom_text = ", ".join(snapshot.anomalies) if snapshot.anomalies else "Ninguna detectada. Señales dentro de línea base."
            ans = (
                f"Telemetría en tiempo real ({snapshot.crew_id}): "
                f"Pulso {snapshot.readings['heart_rate']:.0f} BPM, "
                f"SpO2 {snapshot.readings['spo2']:.0f}%, "
                f"Temp {snapshot.readings['temperature']:.1f}°C, "
                f"CO2 {snapshot.readings['co2']:.1f} mmHg, "
                f"IMU {snapshot.readings['imu']:.2f}g. "
                f"Anomalías: {anom_text}"
            )
        elif any(w in q for w in ("riesgo", "recom", "accion", "refugio", "protocolo", "seguridad")):
            factors_text = ", ".join(snapshot.risk["factors"]) if snapshot.risk["factors"] else "Nominales"
            ans = (
                f"Evaluación de riesgo: {snapshot.risk['summary']} "
                f"(Nivel: {snapshot.risk['level'].upper()}, Prioridad: {snapshot.risk['priority']}). "
                f"Factores contribuyentes: {factors_text}. "
                f"Recomendación ASTRA: {snapshot.risk['recommendation']}"
            )
        elif any(w in q for w in ("enlace", "comunic", "dtn", "buffer", "tierra", "houston")):
            ans = (
                f"Estado de conectividad: Enlace {snapshot.link_status.upper()}. "
                f"Eventos en buffer DTN local: {snapshot.dtn.get('buffered', 0)}. "
                f"Paquetes transmitidos prioritariamente: {snapshot.dtn.get('transmitted', 0)}. "
                f"Continuidad operacional garantizada sin dependencia de Tierra."
            )
        else:
            ans = (
                f"ASTRA Core Intelligence ({snapshot.phase}) — {snapshot.phase_title}: "
                f"{snapshot.phase_message} "
                f"Recomendación actual: {snapshot.risk['recommendation']}"
            )
        return {"role": role, "question": question, "answer": ans}

    def _telemetry_events(self, readings: dict[str, float], priority: str) -> list[TelemetryEvent]:
        events = [
            build_event(
                event_id=f"evt-{self.step:02d}-hr",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="ppg-01",
                metric="heart_rate",
                value=readings["heart_rate"],
                unit="bpm",
                priority=priority,
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-spo2",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="oximeter-01",
                metric="spo2",
                value=readings["spo2"],
                unit="%",
                priority="P1" if readings["spo2"] < 95 else "P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-temp",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="thermal-suit-01",
                metric="temperature",
                value=readings["temperature"],
                unit="°C",
                priority="P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-resp",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="respiration-band-01",
                metric="respiration",
                value=readings["respiration"],
                unit="bpm",
                priority="P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-imu",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="suit-imu-01",
                metric="imu",
                value=readings["imu"],
                unit="g",
                priority="P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-tremor",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="glove-haptic-01",
                metric="tremor",
                value=readings["tremor"],
                unit="index",
                priority="P1" if readings["tremor"] >= 0.45 else "P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-rad",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="dosimeter-01",
                metric="radiation",
                value=readings["radiation"],
                unit="mSv/h",
                priority="P2" if self.step >= 1 else "P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-co2",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="helmet-co2-01",
                metric="co2",
                value=readings["co2"],
                unit="mmHg",
                priority="P2" if readings["co2"] > 5.0 else "P3",
            ),
            build_event(
                event_id=f"evt-{self.step:02d}-o2",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="suit-o2-01",
                metric="o2",
                value=readings["o2"],
                unit="%",
                priority="P3",
            ),
        ]
        return events

    def _phase_label(self) -> str:
        return [
            "PHASE 01 / NOMINAL",
            "PHASE 02 / SOLAR EVENT",
            "PHASE 03 / SIGNAL CORRELATION",
            "PHASE 04 / PREVENTIVE",
            "PHASE 05 / LINK INTERRUPTION",
            "PHASE 06 / LINK RESTORED",
        ][self.step]

    def _phase_title(self) -> str:
        return [
            "EVA nominal",
            "Solar event detected",
            "Crew state changing",
            "Intervention preventive",
            "Local continuity active",
            "Prioritized sync complete",
        ][self.step]

    def _phase_message(self) -> str:
        return [
            "The crew is stable. ASTRA is watching each signal at the edge of silence.",
            "An M-class flare has entered the lunar corridor. Radiation trend is increasing.",
            "Physiology, tremor, and task performance are beginning to diverge from baseline.",
            "ASTRA recommends a calm shelter transition before risk becomes an emergency.",
            "Ground link unavailable. Critical analysis continues locally and telemetry is buffered.",
            "Link restored. Events are forwarded in order of operational urgency.",
        ][self.step]

    def _link_status(self) -> Literal["live", "buffering", "restored"]:
        if self.step == 4 or not self.relay_enabled:
            return "buffering"
        if self.step == 5:
            return "restored"
        return "live"