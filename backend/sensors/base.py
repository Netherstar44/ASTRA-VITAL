from typing import Protocol


class SensorAdapter(Protocol):
    name: str

    def read(self, step: int) -> float:
        """Return one normalized reading for the current mission step."""