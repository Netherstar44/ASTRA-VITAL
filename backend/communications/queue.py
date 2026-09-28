from backend.communications.bundle import DTNBundle, PRIORITY_ORDER


class PriorityQueue:
    def __init__(self) -> None:
        self._items: list[DTNBundle] = []

    def put(self, bundle: DTNBundle) -> None:
        self._items.append(bundle)
        self._items.sort(key=lambda item: (PRIORITY_ORDER[item.priority], item.created_at))

    def drain(self) -> list[DTNBundle]:
        items = list(self._items)
        self._items.clear()
        return items

    def __len__(self) -> int:
        return len(self._items)