"""
Enhanced DTN Store — FASE 7: Resilient Communication

Implements:
  - Priority queue (P0 → P4)
  - Store-and-forward with connection loss
  - Retry tracking with exponential back-off
  - Detailed per-priority buffer counts
  - Dead-letter tracking for exhausted bundles
  - Flush summary for UI animation (what was sent, in which order)
"""
from __future__ import annotations

from backend.communications.bundle import DTNBundle
from backend.communications.queue import PriorityQueue
from backend.communications.retry import RetryTracker


class DTNStore:
    """Store-and-forward buffer for the MVP demo.

    Lifecycle:
      1. While relay is DOWN: enqueue() buffers every outgoing bundle.
      2. When relay is RESTORED: flush() drains in priority order and
         marks each bundle delivered in the RetryTracker.
      3. summary() returns detailed counts for the Network Monitor UI.
    """

    def __init__(self) -> None:
        self.queue = PriorityQueue()
        self.transmitted: list[DTNBundle] = []
        self._retry = RetryTracker()
        # Last flush result — used to animate the "sync complete" UI state
        self._last_flush: list[DTNBundle] = []

    # ------------------------------------------------------------------
    # Ingress
    # ------------------------------------------------------------------

    def enqueue(self, event) -> None:
        bundle = DTNBundle(
            bundle_id=f"bundle-{event.event_id}",
            priority=event.priority,
            payload_type="telemetry",
            payload=event.model_dump(mode="json"),
        )
        self.queue.put(bundle)
        self._retry.register(bundle.bundle_id, bundle.priority)

    # ------------------------------------------------------------------
    # Egress (called when link is restored)
    # ------------------------------------------------------------------

    def flush(self) -> list[DTNBundle]:
        """Drain the priority queue and mark all bundles as delivered."""
        items = self.queue.drain()
        for bundle in items:
            self._retry.mark_delivered(bundle.bundle_id)
        self.transmitted.extend(items)
        self._last_flush = items
        return items

    # ------------------------------------------------------------------
    # Observability
    # ------------------------------------------------------------------

    def summary(self) -> dict:
        """Return a rich summary for the Network Monitor dashboard."""
        # Per-priority counts in the live buffer
        buffer_by_priority: dict[str, int] = {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "P4": 0}
        for bundle in self.queue._items:  # noqa: SLF001 — internal access for summary only
            buffer_by_priority[bundle.priority] += 1

        # Per-priority counts of what has been transmitted so far
        transmitted_by_priority: dict[str, int] = {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "P4": 0}
        for bundle in self.transmitted:
            transmitted_by_priority[bundle.priority] += 1

        retry_summary = self._retry.summary()

        # Ordered flush log (last sync event)
        last_flush_log = [
            {"bundle_id": b.bundle_id, "priority": b.priority, "payload_type": b.payload_type}
            for b in self._last_flush
        ]

        return {
            # Totals (legacy keys — kept for backwards compat with existing frontend)
            "buffered": len(self.queue),
            "transmitted": len(self.transmitted),
            # Detailed per-priority breakdown
            "buffer_by_priority": buffer_by_priority,
            "transmitted_by_priority": transmitted_by_priority,
            # Retry / reliability tracking
            "retry": retry_summary,
            # Last sync event ordered list (for "prioritized sync" animation)
            "last_flush": last_flush_log,
            # Dead letters (permanently undeliverable)
            "dead_letters": len(self._retry.dead_letters()),
        }