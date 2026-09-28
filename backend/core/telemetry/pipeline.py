from backend.core.telemetry.models import TelemetryEvent


def normalize(events: list[TelemetryEvent]) -> list[TelemetryEvent]:
    """The seam for calibration, filtering, and uncertainty scoring."""
    return [
        event
        for event in events
        if event.quality.confidence >= 0.5 and event.quality.signal_quality >= 0.5
    ]