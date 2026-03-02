"""Settings module."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# api-server/.env — resolved so it works regardless of cwd
_env_file = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Settings class."""

    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Read from DATABASE_URL env (set in .env or by Docker Compose).
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/chatapp",
        validation_alias="DATABASE_URL",
    )
    model_name: str = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
    max_recent_messages: int = 16
    model_weights_dir: str = "model_weights"
    hf_token: str | None = None  # Hugging Face token from .env (HF_TOKEN), for gated/private models


settings: Settings = Settings()
