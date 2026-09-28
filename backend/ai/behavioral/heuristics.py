def behavior_summary(snapshot, role: str) -> str:
    factors = snapshot.behavior.get("factors", [])
    if not factors:
        return "Crew behavior remains within the EVA baseline. No behavioral intervention is recommended."
    return (
        f"{snapshot.crew_id} shows a behavioral deviation with {len(factors)} contributing signals: "
        f"{', '.join(factors)}. This is an operational state estimate, not a diagnosis."
    )