"""
ASTRA-VITAL Alert Manager — FASE 6

Architecture: AI/Risk Engine → AlertManager → User Interface

The AlertManager is the single authority that decides:
  - Alert severity (nominal / observation / action / critical)
  - Alert priority for the communications layer (P0–P4)
  - Human-centered message (calm, contextual, non-alarmist)
  - Audio tone profile (none / soft / attention / urgent)
  - Haptic feedback pattern (none / pulse / double / sustained)
  - Interruption level (background / passive / active / mandatory)

Design principles (from ASTRA-VITAL.md section 13–14):
  • The AI does NOT control the interface directly.
  • Alerts must NOT increase crew emotional load unnecessarily.
  • Every alert uses: color + icon + text + sound + vibration (not color alone).
  • States map to HUD symbols:
      nominal      → ● SYSTEM NOMINAL
      observation  → ◐ ENVIRONMENTAL CHANGE + "Review recommended"
      action       → ▲ RETURN-TO-SAFE-ZONE ADVISED
      critical     → ■ CRITICAL — IMMEDIATE CREW ACTION REQUIRED
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel


AlertSeverity = Literal["nominal", "observation", "action", "critical"]
AlertPriority = Literal["P0", "P1", "P2", "P3", "P4"]
AudioTone = Literal["none", "soft", "attention", "urgent"]
HapticPattern = Literal["none", "pulse", "double", "sustained"]
InterruptionLevel = Literal["background", "passive", "active", "mandatory"]
HudSymbol = Literal["●", "◐", "▲", "■"]


# Map severity → HUD design tokens  (symbol, css_tone, interruption)
_SEVERITY_META: dict[AlertSeverity, tuple[HudSymbol, str, InterruptionLevel]] = {
    "nominal":     ("●", "teal",   "background"),
    "observation": ("◐", "amber",  "passive"),
    "action":      ("▲", "red",    "active"),
    "critical":    ("■", "red",    "mandatory"),
}

# Map severity → audio / haptic
_AUDIO_MAP: dict[AlertSeverity, AudioTone] = {
    "nominal":     "none",
    "observation": "soft",
    "action":      "attention",
    "critical":    "urgent",
}

_HAPTIC_MAP: dict[AlertSeverity, HapticPattern] = {
    "nominal":     "none",
    "observation": "pulse",          # single 100 ms pulse
    "action":      "double",         # 160 ms · 80 ms · 160 ms
    "critical":    "sustained",      # 200 ms · 100 ms · 200 ms · 100 ms · 400 ms
}

# Haptic vibration arrays (milliseconds) for the Web Vibration API
HAPTIC_VIBRATION: dict[HapticPattern, list[int]] = {
    "none":      [],
    "pulse":     [100],
    "double":    [160, 80, 160],
    "sustained": [200, 100, 200, 100, 400],
}

# Audio frequency profiles for Web Audio API (hz, duration_ms)
AUDIO_PROFILE: dict[AudioTone, dict] = {
    "none":      {"enabled": False, "freq1": 0, "freq2": 0, "duration_ms": 0, "gain": 0},
    "soft":      {"enabled": True,  "freq1": 440,  "freq2": 659, "duration_ms": 350, "gain": 0.06},
    "attention": {"enabled": True,  "freq1": 587,  "freq2": 880, "duration_ms": 450, "gain": 0.12},
    "urgent":    {"enabled": True,  "freq1": 880,  "freq2": 1174, "duration_ms": 600, "gain": 0.18},
}


class Alert(BaseModel):
    """Fully resolved alert ready for the UI to consume."""
    alert_id: str
    severity: AlertSeverity
    priority: AlertPriority
    hud_symbol: HudSymbol
    hud_label: str              # e.g. "SYSTEM NOMINAL" or "CRITICAL"
    css_tone: str               # "teal" | "amber" | "red"
    title: str                  # Short human-readable title
    message: str                # Calm, contextual explanation
    action_hint: str            # What the crew should do
    audio_tone: AudioTone
    audio_profile: dict
    haptic_pattern: HapticPattern
    haptic_vibration: list[int]
    interruption_level: InterruptionLevel
    factors: list[str]
    recommendation: str
    issued_at: datetime


def _hud_label(severity: AlertSeverity) -> str:
    return {
        "nominal":     "SYSTEM NOMINAL",
        "observation": "ENVIRONMENTAL CHANGE",
        "action":      "RETURN-TO-SAFE-ZONE ADVISED",
        "critical":    "CRITICAL — IMMEDIATE ACTION",
    }[severity]


def _calm_message(severity: AlertSeverity, factors: list[str], risk_summary: str) -> str:
    """Generate a calm, non-alarmist message appropriate for the severity."""
    factor_str = "; ".join(factors) if factors else "no specific anomaly"
    return {
        "nominal": (
            f"All monitored signals are within your individual adaptive baseline. "
            f"ASTRA continues real-time analysis at the edge."
        ),
        "observation": (
            f"A gradual environmental shift has been detected: {factor_str}. "
            f"No immediate action required — monitoring window widened."
        ),
        "action": (
            f"Multiple converging signals indicate increasing risk: {factor_str}. "
            f"A preventive transition is recommended before conditions worsen."
        ),
        "critical": (
            f"Threshold exceeded across critical dimensions: {factor_str}. "
            f"Immediate crew action is required to maintain safety margins."
        ),
    }[severity]


def _action_hint(severity: AlertSeverity) -> str:
    return {
        "nominal":     "Continue current activity. Stay aware.",
        "observation": "Review context when convenient. No urgency.",
        "action":      "Begin shelter transition. Hydrate. Reduce EVA load.",
        "critical":    "Stop current task. Initiate emergency protocol now.",
    }[severity]


def _priority_from_severity(severity: AlertSeverity) -> AlertPriority:
    return {
        "nominal":     "P3",
        "observation": "P2",
        "action":      "P1",
        "critical":    "P0",
    }[severity]


class AlertManager:
    """
    Translates a RiskEngine assessment into a fully-formed Alert.

    Usage:
        manager = AlertManager()
        alert = manager.resolve(risk_dict, step=3)
    """

    def resolve(self, risk: dict, step: int = 0) -> Alert:
        """
        Args:
            risk: dict returned by RiskEngine.assess()
            step: current mission step (0–5)
        Returns:
            Alert — complete, UI-ready alert object
        """
        severity: AlertSeverity = risk.get("level", "nominal")
        factors: list[str] = risk.get("factors", [])
        risk_summary: str = risk.get("summary", "")
        recommendation: str = risk.get("recommendation", "")

        symbol, css_tone, interruption = _SEVERITY_META[severity]
        audio = _AUDIO_MAP[severity]
        haptic = _HAPTIC_MAP[severity]
        priority = _priority_from_severity(severity)

        # Build alert_id deterministic on step + severity for the demo
        alert_id = f"alert-s{step:02d}-{severity}"

        return Alert(
            alert_id=alert_id,
            severity=severity,
            priority=priority,
            hud_symbol=symbol,
            hud_label=_hud_label(severity),
            css_tone=css_tone,
            title=risk_summary,
            message=_calm_message(severity, factors, risk_summary),
            action_hint=_action_hint(severity),
            audio_tone=audio,
            audio_profile=AUDIO_PROFILE[audio],
            haptic_pattern=haptic,
            haptic_vibration=HAPTIC_VIBRATION[haptic],
            interruption_level=interruption,
            factors=factors,
            recommendation=recommendation,
            issued_at=datetime.now(timezone.utc),
        )
