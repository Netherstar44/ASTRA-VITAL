from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    """Environment-backed settings safe for local and serverless execution."""

    mission_id: str = os.getenv("ASTRA_MISSION_ID", "LUNAR-DEMO")
    default_crew_id: str = os.getenv("ASTRA_CREW_ID", "crew-07")
    allowed_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("ASTRA_ALLOWED_ORIGINS", "*").split(",")
        if origin.strip()
    )


settings = Settings()