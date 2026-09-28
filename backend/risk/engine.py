from backend.core.environment.space_weather import SpaceWeatherState
from backend.risk.models import RiskAssessment
from backend.risk.rules import risk_factors


class RiskEngine:
    """Deterministic MVP engine; ML models can be attached behind this contract later."""

    def assess(
        self,
        *,
        readings: dict[str, float],
        environment: SpaceWeatherState,
        health_status: str,
        behavior_state: str,
        relay_enabled: bool,
    ) -> dict:
        factors = risk_factors(
            readings=readings,
            environment_score=environment.risk_score,
            health_status=health_status,
            behavior_state=behavior_state,
            relay_enabled=relay_enabled,
            shielding=environment.shielding,
        )
        score = min(
            0.99,
            environment.risk_score * 0.52
            + max(0, readings["tremor"] - 0.08) * 0.35
            + max(0, 0.98 - readings["task_accuracy"]) * 0.45
            + (0.06 if health_status in {"action", "critical"} else 0)
            + (0.05 if behavior_state == "deviation" else 0)
            + (0.1 if not relay_enabled else 0),
        )
        if health_status == "critical" or score >= 0.85:
            assessment = RiskAssessment(
                level="critical",
                score=score,
                priority="P0",
                summary="Immediate crew action required",
                factors=factors,
                recommendation="Return to the nearest safe zone now.",
            )
        elif score >= 0.6:
            assessment = RiskAssessment(
                level="action",
                score=score,
                priority="P1",
                summary="Preventive action advised",
                factors=factors,
                recommendation="Review shelter transition before continuing EVA.",
            )
        elif score >= 0.35:
            assessment = RiskAssessment(
                level="observation",
                score=score,
                priority="P2",
                summary="Environmental change under observation",
                factors=factors,
                recommendation="Continue monitoring the next telemetry window.",
            )
        else:
            assessment = RiskAssessment(
                level="nominal",
                score=score,
                priority="P3",
                summary="System nominal",
                factors=factors,
                recommendation="No intervention needed.",
            )
        return assessment.model_dump()