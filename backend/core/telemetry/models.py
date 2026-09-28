from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


Priority = Literal["P0", "P1", "P2", "P3", "P4"]


class Measurement(BaseModel):
    type: str
    value: float
    unit: str


class DataQuality(BaseModel):
    confidence: float = Field(ge=0, le=1)
    error_margin: float = Field(ge=0, le=1)
    signal_quality: float = Field(ge=0, le=1)


class TelemetryContext(BaseModel):
    location: str = "MOON_SURFACE"
    activity: str = "EVA"
    mission_phase: str = "EXPLORATION"


class TelemetryEvent(BaseModel):
    event_id: str
    mission_id: str
    astronaut_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_node: str = "suit-01"
    source_sensor: str
    measurement: Measurement
    quality: DataQuality
    context: TelemetryContext
    priority: Priority = "P3"


class CrewState(BaseModel):
    physiology: float = Field(ge=0, le=1)
    behavior: float = Field(ge=0, le=1)
    cognitive_load: float = Field(ge=0, le=1)
    fatigue: float = Field(ge=0, le=1)
    environmental_exposure: float = Field(ge=0, le=1)
    radiation_risk: float = Field(ge=0, le=1)
    mission_stress: float = Field(ge=0, le=1)


class HealthAssessment(BaseModel):
    status: Literal["nominal", "observation", "action", "critical"]
    confidence: float = Field(ge=0, le=1)
    factors: list[str] = Field(default_factory=list)


class HealthEvent(BaseModel):
    event_id: str
    mission_id: str
    astronaut_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["nominal", "observation", "action", "critical"]
    confidence: float = Field(ge=0, le=1)
    factors: list[str] = Field(default_factory=list)
    priority: Priority = "P1"


class EnvironmentalEvent(BaseModel):
    event_id: str
    mission_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: Literal["quiet", "solar_event", "solar_proton_pulse", "radiation_spike", "geomagnetic_storm"]
    flux_value: float
    unit: str = "mSv/h"
    shielding_condition: Literal["nominal", "low", "enhanced"] = "nominal"
    risk_score: float = Field(ge=0, le=1)
    priority: Priority = "P1"


class RiskEvent(BaseModel):
    event_id: str
    mission_id: str
    astronaut_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    risk_level: Literal["nominal", "observation", "action", "critical"]
    score: float = Field(ge=0, le=1)
    factors: list[str] = Field(default_factory=list)
    recommendation: str
    priority: Priority = "P1"


class AlertEvent(BaseModel):
    event_id: str
    mission_id: str
    astronaut_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    severity: Literal["nominal", "observation", "action", "critical"]
    hud_symbol: str
    hud_label: str
    title: str
    message: str
    action_hint: str
    audio_tone: Literal["none", "soft", "attention", "urgent"] = "none"
    haptic_pattern: str = "none"
    interruption_level: Literal["background", "passive", "active", "mandatory"] = "background"
    priority: Priority = "P1"


class DTNBundle(BaseModel):
    bundle_id: str
    source_node: str
    destination_node: str
    creation_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    priority: Priority = "P3"
    ttl_seconds: int = 3600
    payload: dict = Field(default_factory=dict)
    delivered: bool = False
    hop_count: int = 0


def build_event(
    *,
    event_id: str,
    mission_id: str,
    astronaut_id: str,
    sensor: str,
    metric: str,
    value: float,
    unit: str,
    priority: Priority = "P3",
    confidence: float = 0.94,
) -> TelemetryEvent:
    return TelemetryEvent(
        event_id=event_id,
        mission_id=mission_id,
        astronaut_id=astronaut_id,
        source_sensor=sensor,
        measurement=Measurement(type=metric, value=value, unit=unit),
        quality=DataQuality(
            confidence=confidence,
            error_margin=round(1 - confidence, 2),
            signal_quality=min(0.99, round(confidence + 0.02, 2)),
        ),
        context=TelemetryContext(),
        priority=priority,
    )