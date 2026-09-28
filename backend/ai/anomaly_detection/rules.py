def detect_anomalies(readings: dict[str, float]) -> list[str]:
    anomalies: list[str] = []
    if readings["heart_rate"] >= 115:
        anomalies.append("heart rate diverging from baseline")
    if readings["tremor"] >= 0.35:
        anomalies.append("tremor pattern detected")
    if readings["task_accuracy"] < 0.92:
        anomalies.append("task accuracy declining")
    return anomalies