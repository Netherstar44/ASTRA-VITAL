from typing import Literal

from pydantic import BaseModel, Field


class RiskAssessment(BaseModel):
    level: Literal["nominal", "observation", "action", "critical"]
    score: float = Field(ge=0, le=1)
    priority: Literal["P0", "P1", "P2", "P3", "P4"]
    summary: str
    factors: list[str] = Field(default_factory=list)
    recommendation: str