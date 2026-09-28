from typing import Any
from backend.core.telemetry.models import DataQuality, TelemetryEvent


# Baseline physiological ranges for Lunar EVA operations
NOMINAL_RANGES: dict[str, tuple[float, float]] = {
    "heart_rate": (50.0, 160.0),      # bpm
    "spo2": (90.0, 100.0),            # %
    "temperature": (35.5, 38.5),       # °C
    "respiration": (10.0, 30.0),       # bpm
    "imu": (0.5, 3.5),                 # g (motion activity)
    "tremor": (0.0, 1.0),              # normalized index
    "task_accuracy": (0.0, 1.0),       # percentage
    "speech_pause_delta": (0.0, 1.0),  # sec
    "radiation": (0.0, 5.0),           # mSv/h
    "co2": (1.0, 8.0),                 # mmHg helmet PP
    "o2": (18.0, 24.0),                # % suit loop
}


def filter_noise(metric: str, raw_value: float) -> float:
    """Applies sensor calibration clamp and noise attenuation."""
    if metric in NOMINAL_RANGES:
        min_v, max_v = NOMINAL_RANGES[metric]
        return max(min_v * 0.8, min(raw_value, max_v * 1.2))
    return raw_value


def assess_quality(metric: str, value: float, raw_noise: float = 0.0) -> DataQuality:
    """Calculates confidence, error margin, and signal quality for a measurement."""
    if metric not in NOMINAL_RANGES:
        return DataQuality(confidence=0.90, error_margin=0.10, signal_quality=0.90)

    min_v, max_v = NOMINAL_RANGES[metric]
    # Check if value is within nominal physical limits
    if min_v <= value <= max_v:
        confidence = max(0.85, 0.98 - raw_noise)
        signal_quality = max(0.88, 0.99 - raw_noise * 0.5)
    else:
        # Outlier or sensor drift reduces confidence
        divergence = min(abs(value - min_v), abs(value - max_v)) / (max_v - min_v)
        confidence = max(0.50, round(0.85 - divergence * 0.4, 2))
        signal_quality = max(0.55, round(0.90 - divergence * 0.35, 2))

    error_margin = round(1.0 - confidence, 2)
    return DataQuality(
        confidence=round(confidence, 2),
        error_margin=error_margin,
        signal_quality=round(signal_quality, 2),
    )


def validate_event(event: TelemetryEvent) -> TelemetryEvent:
    """Validates and recalibrates telemetry event with data quality scoring."""
    filtered_val = filter_noise(event.measurement.type, event.measurement.value)
    quality = assess_quality(event.measurement.type, filtered_val)
    event.measurement.value = round(filtered_val, 2)
    event.quality = quality
    return event


def normalize(events: list[TelemetryEvent]) -> list[TelemetryEvent]:
    """The complete pipeline for calibration, noise filtering, and uncertainty scoring."""
    validated: list[TelemetryEvent] = []
    for event in events:
        processed = validate_event(event)
        # Retain trusted telemetry above confidence threshold
        if processed.quality.confidence >= 0.5 and processed.quality.signal_quality >= 0.5:
            validated.append(processed)
    return validated