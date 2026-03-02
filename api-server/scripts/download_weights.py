"""Download model weights from Hugging Face using app config."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from transformers import AutoModelForCausalLM, AutoTokenizer

_MODEL_ID = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
_MODEL_WEIGHTS_DIR = Path(__file__).resolve().parent.parent / "model_weights"
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class _Env(BaseSettings):
    """Env vars loaded from api-server/.env."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )
    HF_TOKEN: str | None = None


_env = _Env()
MODEL_ID = _MODEL_ID
MODEL_WEIGHTS_DIR = _MODEL_WEIGHTS_DIR
HF_TOKEN = _env.HF_TOKEN


def download_weights(model_id: str, output_dir: Path, token: str | None = None) -> None:
    """Download model and tokenizer from Hugging Face and save to output_dir."""
    print(f"Downloading {model_id} to {output_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)
    model = AutoModelForCausalLM.from_pretrained(model_id, token=token)
    tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)


def main() -> None:
    """Download weights for the model and directory defined in app config."""
    output_dir = MODEL_WEIGHTS_DIR
    print(f"Downloading {MODEL_ID} to {output_dir}")
    download_weights(MODEL_ID, output_dir, token=HF_TOKEN)
    print("Done.")


if __name__ == "__main__":
    main()
