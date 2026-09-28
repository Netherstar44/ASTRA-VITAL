from dataclasses import dataclass


@dataclass(frozen=True)
class SimulatedSensor:
    name: str
    values: tuple[float, ...]

    def read(self, step: int) -> float:
        return self.values[min(max(step, 0), len(self.values) - 1)]


SENSORS = {
    "heart_rate": SimulatedSensor("heart_rate", (72, 84, 104, 126, 132, 118)),
    "spo2": SimulatedSensor("spo2", (98, 98, 97, 96, 95, 97)),
    "temperature": SimulatedSensor("temperature", (36.8, 36.8, 36.9, 37.0, 37.1, 36.9)),
    "respiration": SimulatedSensor("respiration", (14, 15, 17, 20, 22, 18)),
    "tremor": SimulatedSensor("tremor", (0.08, 0.1, 0.22, 0.42, 0.51, 0.26)),
    "task_accuracy": SimulatedSensor("task_accuracy", (0.99, 0.98, 0.95, 0.9, 0.84, 0.94)),
    "speech_pause_delta": SimulatedSensor("speech_pause_delta", (0.02, 0.04, 0.1, 0.24, 0.31, 0.16)),
    "radiation": SimulatedSensor("radiation", (0.22, 0.28, 0.46, 0.78, 0.96, 0.62)),
}


def readings_for_step(step: int) -> dict[str, float]:
    return {name: sensor.read(step) for name, sensor in SENSORS.items()}