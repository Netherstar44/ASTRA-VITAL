from backend.communications.bundle import DTNBundle
from backend.communications.queue import PriorityQueue


class DTNStore:
    """Small store-and-forward buffer for the MVP demo."""

    def __init__(self) -> None:
        self.queue = PriorityQueue()
        self.transmitted: list[DTNBundle] = []

    def enqueue(self, event) -> None:
        self.queue.put(
            DTNBundle(
                bundle_id=f"bundle-{event.event_id}",
                priority=event.priority,
                payload_type="telemetry",
                payload=event.model_dump(mode="json"),
            )
        )

    def flush(self) -> list[DTNBundle]:
        items = self.queue.drain()
        self.transmitted.extend(items)
        return items

    def summary(self) -> dict[str, int]:
        counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "P4": 0}
        for bundle in self.transmitted:
            counts[bundle.priority] += 1
        counts["buffered"] = len(self.queue)
        counts["transmitted"] = len(self.transmitted)
        return counts