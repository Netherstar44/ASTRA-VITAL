class InMemoryRepository:
    """Serverless-safe seam for the MVP; replace with durable storage for production history."""

    def __init__(self) -> None:
        self._records: list[dict] = []

    def append(self, record: dict) -> None:
        self._records.append(record)

    def list(self) -> list[dict]:
        return list(self._records)