"""
Retry / Store-and-Forward policy for ASTRA-VITAL DTN layer.

Each bundle tracks how many times delivery has been attempted.
When the link is down, bundles accumulate in the PriorityQueue.
When the link is restored, flush() drains bundles in priority order
and marks each one as transmitted.  Bundles that permanently fail
(e.g. TTL exceeded) are moved to the dead-letter store.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

MAX_RETRIES = 5
BUNDLE_TTL_SECONDS = 3600  # 1 hour — typical lunar communication window


class RetryRecord:
    """Tracks delivery attempts for a single DTN bundle."""

    def __init__(self, bundle_id: str, priority: Literal["P0", "P1", "P2", "P3", "P4"]) -> None:
        self.bundle_id = bundle_id
        self.priority = priority
        self.attempts = 0
        self.last_attempt: datetime | None = None
        self.delivered = False
        self.created_at: datetime = datetime.now(timezone.utc)

    @property
    def expired(self) -> bool:
        age = (datetime.now(timezone.utc) - self.created_at).total_seconds()
        return age > BUNDLE_TTL_SECONDS

    @property
    def exhausted(self) -> bool:
        return self.attempts >= MAX_RETRIES

    def record_attempt(self) -> None:
        self.attempts += 1
        self.last_attempt = datetime.now(timezone.utc)

    def mark_delivered(self) -> None:
        self.delivered = True

    def next_retry_at(self) -> datetime:
        """Exponential back-off: 2^attempts seconds, capped at 60 s."""
        delay = min(2 ** self.attempts, 60)
        base = self.last_attempt or self.created_at
        return base + timedelta(seconds=delay)

    def ready_for_retry(self) -> bool:
        if self.delivered or self.exhausted or self.expired:
            return False
        return datetime.now(timezone.utc) >= self.next_retry_at()


class RetryTracker:
    """In-memory store for retry metadata keyed by bundle_id."""

    def __init__(self) -> None:
        self._records: dict[str, RetryRecord] = {}

    def register(self, bundle_id: str, priority: Literal["P0", "P1", "P2", "P3", "P4"]) -> RetryRecord:
        record = RetryRecord(bundle_id, priority)
        self._records[bundle_id] = record
        return record

    def get(self, bundle_id: str) -> RetryRecord | None:
        return self._records.get(bundle_id)

    def mark_delivered(self, bundle_id: str) -> None:
        record = self._records.get(bundle_id)
        if record:
            record.mark_delivered()

    def dead_letters(self) -> list[RetryRecord]:
        return [r for r in self._records.values() if (r.exhausted or r.expired) and not r.delivered]

    def pending(self) -> list[RetryRecord]:
        return [r for r in self._records.values() if not r.delivered and not r.exhausted and not r.expired]

    def summary(self) -> dict:
        records = list(self._records.values())
        return {
            "total": len(records),
            "delivered": sum(1 for r in records if r.delivered),
            "pending": sum(1 for r in records if not r.delivered and not r.exhausted and not r.expired),
            "dead_letters": len(self.dead_letters()),
        }
