def risk_factors(
    *,
    readings: dict[str, float],
    environment_score: float,
    health_status: str,
    behavior_state: str,
    relay_enabled: bool,
) -> list[str]:
    factors: list[str] = []
    if environment_score >= 0.6:
        factors.append("radiation trend increasing")
    if readings["tremor"] >= 0.35:
        factors.append("tremor above baseline")
    if readings["task_accuracy"] < 0.92:
        factors.append("task performance deviation")
    if health_status in {"action", "critical"}:
        factors.append("physiological deviation")
    if behavior_state == "deviation":
        factors.append("behavioral pattern deviation")
    if not relay_enabled:
        factors.append("communication link interrupted")
    return factors