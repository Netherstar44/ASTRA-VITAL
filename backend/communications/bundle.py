from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


class DTNBundle(BaseModel):
    bundle_id: str
    priority: Literal["P0", "P1", "P2", "P3", "P4"]
    payload_type: str
    payload: dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


PRIORITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "P4": 4}