def risk_factors(
    *,
    readings: dict[str, float],
    environment_score: float,
    health_status: str,
    behavior_state: str,
    relay_enabled: bool,
    is_eva: bool = True,
    shielding: str = "low",
) -> list[str]:
    factors: list[str] = []
    # Rule: IF radiation ↑ AND EVA = TRUE AND shielding = LOW THEN radiation_risk = HIGH
    if environment_score >= 0.5 and is_eva and shielding in {"low", "minimal", "suit_only"}:
        factors.append("radiation_risk = HIGH (Solar event active during unshielded EVA)")
    elif environment_score >= 0.4:
        factors.append("radiation trend increasing")

    if readings.get("tremor", 0.0) >= 0.35:
        factors.append("tremor above baseline")
    if readings.get("task_accuracy", 1.0) < 0.92:
        factors.append("task performance deviation")
    if health_status in {"action", "critical"}:
        factors.append("physiological deviation")
    if behavior_state == "deviation":
        factors.append("behavioral pattern deviation")
    if not relay_enabled:
        factors.append("communication link interrupted")
    return factors