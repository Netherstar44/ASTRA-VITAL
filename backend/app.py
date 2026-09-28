from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ai.assistant.service import answer
from backend.config.settings import settings
from backend.core.mission.state import MissionService


class RelayInput(BaseModel):
    enabled: bool


class AssistantInput(BaseModel):
    role: str = "flight_controller"
    question: str = Field(min_length=1, max_length=500)


mission = MissionService()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ASTRA-VITAL API",
        version="0.1.0",
        description="Local-first mission health intelligence for lunar EVA operations.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["health"])
    @app.get("/api/healthz", tags=["health"], include_in_schema=False)
    def healthz() -> dict[str, str]:
        return {"status": "ok", "service": "astra-vital"}

    @app.get("/api/mission/state", tags=["mission"])
    def get_mission_state():
        return mission.snapshot()

    @app.post("/api/mission/advance", tags=["mission"])
    def advance_mission():
        return mission.advance()

    @app.post("/api/mission/reset", tags=["mission"])
    def reset_mission():
        return mission.reset()

    @app.post("/api/communications/relay", tags=["communications"])
    def set_relay(payload: RelayInput):
        return mission.set_relay(payload.enabled)

    @app.post("/api/assistant", tags=["assistant"])
    def ask_assistant(payload: AssistantInput):
        return answer(mission, role=payload.role, question=payload.question)

    return app


app = create_app()