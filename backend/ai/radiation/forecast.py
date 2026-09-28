def radiation_summary(snapshot, role: str) -> str:
    environment = snapshot.environment
    return (
        f"{environment.event_name}. Radiation risk is {environment.risk_score:.0%} and "
        f"the trend is {environment.radiation_trend}. The recommended action is: "
        f"{snapshot.risk['recommendation']}"
    )