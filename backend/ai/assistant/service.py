from backend.core.mission.state import MissionService


def answer(service: MissionService, *, role: str, question: str) -> dict[str, str]:
    return service.assistant_answer(role=role, question=question)