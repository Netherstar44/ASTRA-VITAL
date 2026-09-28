from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

from backend.ai.anomaly_detection.rules import detect_anomalies
from backend.ai.behavioral.heuristics import behavior_summary
from backend.ai.radiation.forecast import radiation_summary
from backend.communications.dtn import DTNStore
from backend.config.settings import settings
from backend.core.behavior.analyzer import assess_behavior
from backend.core.environment.space_weather import SpaceWeatherState, space_weather_for_step
from backend.core.health.analyzer import assess_health
from backend.core.telemetry.models import CrewState, TelemetryEvent, build_event
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
        crew_state = CrewState(
            physiology=max(0.12, 1 - min(0.88, max(0, readings["heart_rate"] - 72) / 120)),
            behavior=max(0.12, readings["task_accuracy"] - readings["tremor"] * 0.25),
            cognitive_load=min(0.98, 0.38 + self.step * 0.1),
            fatigue=min(0.95, 0.22 + self.step * 0.12),
            environmental_exposure=environment.risk_score,
            radiation_risk=environment.risk_score,
            mission_stress=min(0.92, 0.28 + self.step * 0.11),
        )
        events = self._telemetry_events(readings, risk["priority"])
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
            anomalies=detect_anomalies(readings),
            telemetry=events,
            dtn=self.store.summary(),
            updated_at=datetime.now(timezone.utc),
        )

    def assistant_answer(self, role: str, question: str) -> dict[str, str]:
        snapshot = self.snapshot()
        return {
            "role": role,
            "question": question,
            "answer": behavior_summary(snapshot, role)
            if "comport" in question.lower()
            else radiation_summary(snapshot, role),
        }

    def _telemetry_events(self, readings: dict[str, float], priority: str) -> list[TelemetryEvent]:
        return [
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
                event_id=f"evt-{self.step:02d}-rad",
                mission_id=settings.mission_id,
                astronaut_id=settings.default_crew_id,
                sensor="dosimeter-01",
                metric="radiation",
                value=readings["radiation"],
                unit="mSv/h",
                priority="P2" if self.step >= 1 else "P3",
            ),
        ]

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