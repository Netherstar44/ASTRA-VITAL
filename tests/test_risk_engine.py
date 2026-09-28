"""Tests for Risk Engine deterministic rules and scoring."""

import unittest
from backend.core.environment.space_weather import SpaceWeatherState
from backend.risk.engine import RiskEngine
from backend.risk.rules import radiation_risk_rule


class TestRiskEngine(unittest.TestCase):
    def test_radiation_risk_rule_deterministic(self):
        # IF radiation > 0.45 AND EVA = TRUE AND shielding = LOW THEN radiation_risk = HIGH
        rule_fired = radiation_risk_rule(
            radiation_trend=0.65,
            is_eva=True,
            shielding="low",
        )
        self.assertTrue(rule_fired)

        # When shielding is high, rule should not fire
        rule_not_fired = radiation_risk_rule(
            radiation_trend=0.65,
            is_eva=True,
            shielding="high",
        )
        self.assertFalse(rule_not_fired)

    def test_risk_engine_nominal_assessment(self):
        engine = RiskEngine()
        env = SpaceWeatherState(
            event="quiet",
            event_name="Nominal quiet corridor",
            radiation_trend="stable",
            shielding="high",
            risk_score=0.12,
        )
        readings = {
            "heart_rate": 72.0,
            "spo2": 98.0,
            "tremor": 0.10,
            "task_accuracy": 0.98,
            "radiation": 0.22,
        }
        assessment = engine.assess(
            readings=readings,
            environment=env,
            health_status="nominal",
            behavior_state="nominal",
            relay_enabled=True,
        )
        self.assertEqual(assessment["level"], "nominal")
        self.assertEqual(assessment["priority"], "P3")
        self.assertLess(assessment["score"], 0.35)

    def test_risk_engine_preventive_action_assessment(self):
        engine = RiskEngine()
        env = SpaceWeatherState(
            event="solar_event",
            event_name="Solar Event S-17",
            radiation_trend="increasing",
            shielding="low",
            risk_score=0.75,
        )
        readings = {
            "heart_rate": 126.0,
            "spo2": 96.0,
            "tremor": 0.42,
            "task_accuracy": 0.82,
            "radiation": 0.78,
        }
        assessment = engine.assess(
            readings=readings,
            environment=env,
            health_status="action",
            behavior_state="deviation",
            relay_enabled=True,
        )
        self.assertIn(assessment["level"], ("action", "critical"))
        self.assertIn(assessment["priority"], ("P1", "P0"))
        self.assertGreater(len(assessment["factors"]), 0)


if __name__ == "__main__":
    unittest.main()
