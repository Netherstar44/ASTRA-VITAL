"""Tests for FASE 6 Alert Manager."""

import unittest
from backend.alerts.manager import AlertManager


class TestAlertManager(unittest.TestCase):
    def test_alert_manager_nominal(self):
        manager = AlertManager()
        alert = manager.resolve({
            "level": "nominal",
            "factors": [],
            "summary": "All signals nominal",
            "recommendation": "Continue EVA.",
        })
        self.assertEqual(alert.severity, "nominal")
        self.assertEqual(alert.hud_symbol, "●")
        self.assertEqual(alert.hud_label, "SYSTEM NOMINAL")
        self.assertEqual(alert.priority, "P3")
        self.assertEqual(alert.audio_tone, "none")
        self.assertEqual(alert.haptic_pattern, "none")
        self.assertEqual(alert.interruption_level, "background")

    def test_alert_manager_observation(self):
        manager = AlertManager()
        alert = manager.resolve({
            "level": "observation",
            "factors": ["solar radiation rising"],
            "summary": "Minor solar flux elevation",
            "recommendation": "Monitor dosimeter.",
        })
        self.assertEqual(alert.severity, "observation")
        self.assertEqual(alert.hud_symbol, "◐")
        self.assertEqual(alert.hud_label, "ENVIRONMENTAL CHANGE")
        self.assertEqual(alert.priority, "P2")
        self.assertEqual(alert.audio_tone, "soft")
        self.assertEqual(alert.haptic_pattern, "pulse")
        self.assertEqual(alert.interruption_level, "passive")

    def test_alert_manager_action(self):
        manager = AlertManager()
        alert = manager.resolve({
            "level": "action",
            "factors": ["radiation_risk = HIGH", "tremor detected"],
            "summary": "Multi-signal convergence",
            "recommendation": "Begin shelter transition.",
        })
        self.assertEqual(alert.severity, "action")
        self.assertEqual(alert.hud_symbol, "▲")
        self.assertEqual(alert.hud_label, "RETURN-TO-SAFE-ZONE ADVISED")
        self.assertEqual(alert.priority, "P1")
        self.assertEqual(alert.audio_tone, "attention")
        self.assertEqual(alert.haptic_pattern, "double")
        self.assertEqual(alert.interruption_level, "active")
        self.assertEqual(len(alert.factors), 2)

    def test_alert_manager_critical(self):
        manager = AlertManager()
        alert = manager.resolve({
            "level": "critical",
            "factors": ["SpO2 below 85%", "suit pressure dropping"],
            "summary": "Acute hypoxia emergency",
            "recommendation": "Abort EVA immediately.",
        })
        self.assertEqual(alert.severity, "critical")
        self.assertEqual(alert.hud_symbol, "■")
        self.assertEqual(alert.hud_label, "CRITICAL — IMMEDIATE ACTION")
        self.assertEqual(alert.priority, "P0")
        self.assertEqual(alert.audio_tone, "urgent")
        self.assertEqual(alert.haptic_pattern, "sustained")
        self.assertEqual(alert.interruption_level, "mandatory")


if __name__ == "__main__":
    unittest.main()
