"""Tests for FASE 7 DTN Store and Resilient Communication."""

import unittest
from backend.communications.bundle import DTNBundle
from backend.communications.dtn import DTNStore
from backend.communications.retry import RetryTracker
from backend.core.telemetry.models import build_event


class TestDTN(unittest.TestCase):
    def test_dtn_priority_order_flush(self):
        store = DTNStore()

        # Enqueue events of different priorities (P3, P0, P1)
        ev_p3 = build_event(
            event_id="e-p3",
            mission_id="m1",
            astronaut_id="a1",
            sensor="s1",
            metric="temp",
            value=36.5,
            unit="C",
            priority="P3",
        )
        ev_p0 = build_event(
            event_id="e-p0",
            mission_id="m1",
            astronaut_id="a1",
            sensor="s2",
            metric="hr",
            value=150.0,
            unit="bpm",
            priority="P0",
        )
        ev_p1 = build_event(
            event_id="e-p1",
            mission_id="m1",
            astronaut_id="a1",
            sensor="s3",
            metric="spo2",
            value=92.0,
            unit="%",
            priority="P1",
        )

        store.enqueue(ev_p3)
        store.enqueue(ev_p0)
        store.enqueue(ev_p1)

        self.assertEqual(store.buffered_count, 3)

        # Flush should drain strictly in priority order: P0 -> P1 -> P3
        flushed = store.flush()
        self.assertEqual(len(flushed), 3)
        priorities = [b.priority for b in flushed]
        self.assertEqual(priorities, ["P0", "P1", "P3"])
        self.assertEqual(store.buffered_count, 0)
        self.assertEqual(len(store.transmitted), 3)

    def test_retry_tracker_exponential_backoff(self):
        tracker = RetryTracker()
        tracker.register("bundle-01", "P1")

        status = tracker.get("bundle-01")
        self.assertIsNotNone(status)
        self.assertFalse(status.delivered)
        self.assertEqual(status.attempts, 0)

        # First retry attempt
        status.record_attempt()
        self.assertEqual(status.attempts, 1)
        delay1 = min(2 ** status.attempts, 60)
        self.assertEqual(delay1, 2)

        # Second retry attempt
        status.record_attempt()
        self.assertEqual(status.attempts, 2)
        delay2 = min(2 ** status.attempts, 60)
        self.assertEqual(delay2, 4)

        tracker.mark_delivered("bundle-01")
        self.assertTrue(tracker.get("bundle-01").delivered)


if __name__ == "__main__":
    unittest.main()
