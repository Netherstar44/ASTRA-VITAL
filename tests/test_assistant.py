"""Tests for FASE 9 Context-Aware AI Assistant."""

import unittest
from backend.ai.assistant.service import generate_role_answer, _clean_text, _normalize_role
from backend.core.mission.state import MissionService


class TestAssistant(unittest.TestCase):
    def test_clean_text_and_normalize_role(self):
        self.assertEqual(_clean_text("¿Por qué me estás alertando?"), "por que me estas alertando")
        self.assertEqual(_normalize_role("Astronaut (EVA)"), "astronaut")
        self.assertEqual(_normalize_role("Flight Controller"), "flight_controller")
        self.assertEqual(_normalize_role("Medical Officer"), "medical_officer")
        self.assertEqual(_normalize_role("Behavioral Health"), "behavioral_health")

    def test_assistant_role_responses_nominal(self):
        service = MissionService()
        service.step = 0
        snapshot = service.snapshot()

        # Astronaut
        res_astro = generate_role_answer(snapshot, "astronaut", "¿Por qué me estás alertando?")
        self.assertIn("NOMINAL", res_astro["answer"])
        self.assertEqual(res_astro["severity"], "nominal")

        # Flight Controller
        res_flight = generate_role_answer(snapshot, "flight_controller", "¿Qué está ocurriendo con Crew-07?")
        self.assertIn("TELEMETRIA", res_flight["answer"])
        self.assertIn("REDES", res_flight["answer"])

        # Medical Officer
        res_med = generate_role_answer(snapshot, "medical_officer", "¿Qué cambios fisiológicos presenta?")
        self.assertIn("DATOS FISIOLOGICOS", res_med["answer"])
        self.assertIn("TENDENCIAS", res_med["answer"])

        # Behavioral Health
        res_beh = generate_role_answer(snapshot, "behavioral_health", "¿Se han detectado cambios de comportamiento?")
        self.assertIn("PATRONES CONDUCTUALES", res_beh["answer"])
        self.assertTrue("CARGA COGNITIVA" in res_beh["answer"].upper() or "TEMBLOR" in res_beh["answer"].upper())

    def test_assistant_astronaut_alert_response_preventive(self):
        service = MissionService()
        service.step = 3  # Preventive alert state
        snapshot = service.snapshot()

        res = generate_role_answer(snapshot, "astronaut", "¿Por qué me estás alertando?")
        ans = res["answer"]
        self.assertIn("QUE OCURRIO", ans)
        self.assertIn("IMPORTANCIA", ans)
        self.assertIn("ACCION A REALIZAR", ans)
        self.assertIn("QUE EVITAR", ans)


if __name__ == "__main__":
    unittest.main()
