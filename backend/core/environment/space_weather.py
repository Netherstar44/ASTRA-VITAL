from typing import Literal

from pydantic import BaseModel, Field


class SpaceWeatherState(BaseModel):
    event: Literal["quiet", "solar_event", "solar_storm"] = "quiet"
    event_name: str = "Quiet solar corridor"
    radiation_trend: Literal["stable", "increasing", "decreasing"] = "stable"
    shielding: Literal["high", "low"] = "high"
    risk_score: float = Field(ge=0, le=1)


def space_weather_for_step(step: int) -> SpaceWeatherState:
    if step < 1:
        return SpaceWeatherState(risk_score=0.22)
    if step < 3:
        return SpaceWeatherState(
            event="solar_event",
            event_name="M-class flare detected",
            radiation_trend="increasing",
            shielding="low",
            risk_score=0.61,
        )
    if step < 5:
        return SpaceWeatherState(
            event="solar_event",
            event_name="M-class flare propagating",
            radiation_trend="increasing",
            shielding="low",
            risk_score=0.81,
        )
    return SpaceWeatherState(
        event="solar_event",
        event_name="Solar corridor stabilizing",
        radiation_trend="decreasing",
        shielding="high",
        risk_score=0.54,
    )