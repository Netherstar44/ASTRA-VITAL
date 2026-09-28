from backend.communications.bundle import DTNBundle, PRIORITY_ORDER


def sort_for_forwarding(bundles: list[DTNBundle]) -> list[DTNBundle]:
    """Forward P0 emergency data before health, environment, telemetry, and bulk data."""
    return sorted(
        bundles,
        key=lambda bundle: (PRIORITY_ORDER[bundle.priority], bundle.created_at),
    )