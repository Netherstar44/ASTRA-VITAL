from pydantic import BaseModel, Field


class BehaviorAssessment(BaseModel):
    state: str
    confidence: float = Field(ge=0, le=1)
    factors: list[str] = Field(default_factory=list)


def assess_behavior(readings: dict[str, float]) -> BehaviorAssessment:
    tremor = readings["tremor"]
    task_accuracy = readings["task_accuracy"]
    speech_pause_delta = readings["speech_pause_delta"]
    factors: list[str] = []

    if tremor >= 0.35:
        factors.append("motor precision deviation")
    if task_accuracy < 0.9:
        factors.append("task performance below baseline")
    if speech_pause_delta >= 0.2:
        factors.append("speech pause pattern changed")

    state = "deviation" if factors else "nominal"
    return BehaviorAssessment(
        state=state,
        confidence=min(0.95, 0.65 + len(factors) * 0.08) if factors else 0.92,
        factors=factors,
    )