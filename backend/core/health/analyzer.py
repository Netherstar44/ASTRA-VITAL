from backend.core.telemetry.models import HealthAssessment


def assess_health(readings: dict[str, float]) -> HealthAssessment:
    heart_rate = readings["heart_rate"]
    oxygen = readings["spo2"]
    tremor = readings["tremor"]
    factors: list[str] = []

    if heart_rate >= 120:
        factors.append("heart rate above EVA baseline")
    if oxygen < 95:
        factors.append("oxygen saturation below baseline")
    if tremor >= 0.45:
        factors.append("tremor trend increasing")

    if oxygen < 92 or heart_rate >= 145:
        status = "critical"
    elif len(factors) >= 2:
        status = "action"
    elif factors:
        status = "observation"
    else:
        status = "nominal"

    confidence = 0.96 if not factors else min(0.98, 0.68 + len(factors) * 0.1)
    return HealthAssessment(status=status, confidence=confidence, factors=factors)