"""LLM service: load HuggingFace model and stream completions."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from threading import Thread
from typing import Any, cast

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
)
from transformers.modeling_utils import PreTrainedModel

from app.config import settings
from app.enums.errors import Errors

# Singleton for app lifespan
llm_service: LLMService | None = None


class LLMService:
    """Loads a Hugging Face model and tokenizer; streams token generation."""

    _model: PreTrainedModel | None
    _tokenizer: Any  # AutoTokenizer stubs are incomplete

    def __init__(self) -> None:
        """Initialize the LLM service."""
        self._model = None
        self._tokenizer = None

    def load(self) -> None:
        """Load model and tokenizer from local weights. Call once at startup."""
        weights_path = settings.model_weights_dir
        self._tokenizer = AutoTokenizer.from_pretrained(
            weights_path,
            local_files_only=True,
        )
        self._model = AutoModelForCausalLM.from_pretrained(
            weights_path,
            torch_dtype="auto",
            device_map="cpu",
            local_files_only=True,
        )
        self._model.eval()

    def is_loaded(self) -> bool:
        """Check if the model and tokenizer are loaded."""
        return self._model is not None and self._tokenizer is not None

    async def stream_completion(
        self,
        messages: list[dict[str, str]],
        max_new_tokens: int = 512,
    ) -> AsyncGenerator[str, None]:
        """
        Format messages with chat template, generate, and yield tokens.
        messages: [{"role": "user"|"assistant"|"system", "content": "..."}].
        """
        if not self.is_loaded() or not self._tokenizer or not self._model:
            raise RuntimeError(Errors.LLM_NOT_LOADED)

        prompt = self._tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=False,
        )
        inputs = self._tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
        ).to(self._model.device)

        streamer = TextIteratorStreamer(
            cast("AutoTokenizer", self._tokenizer),
            skip_prompt=True,
            skip_special_tokens=True,
        )
        gen_kwargs = {
            **inputs,
            "max_new_tokens": max_new_tokens,
            "streamer": streamer,
            "do_sample": False,
        }

        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def run_generate() -> None:
            assert self._model is not None
            self._model.generate(**gen_kwargs)  # type: ignore[operator]

        def feed_queue() -> None:
            for token in streamer:
                queue.put_nowait(token)
            queue.put_nowait(None)

        gen_thread = Thread(target=run_generate)
        gen_thread.start()
        feed_thread = Thread(target=feed_queue)
        feed_thread.start()

        try:
            while True:
                token = await queue.get()
                if token is None:
                    break
                yield token
        finally:
            feed_thread.join()
            gen_thread.join()

    def generate_non_streaming(
        self,
        messages: list[dict[str, str]],
        max_new_tokens: int = 64,
    ) -> str:
        """Generate a single completion without streaming (e.g. for titles)."""
        if not self.is_loaded() or not self._tokenizer or not self._model:
            raise RuntimeError(Errors.LLM_NOT_LOADED)

        prompt = self._tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=False,
        )
        inputs = self._tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
        ).to(self._model.device)
        output = self._model.generate(  # type: ignore[operator]
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
        )
        # Decode only the new tokens
        new_tokens = output[0][inputs["input_ids"].shape[1] :]
        return self._tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


def get_llm_service() -> LLMService:
    """Return the global LLM service (set by main lifespan)."""
    if llm_service is None:
        raise RuntimeError(Errors.LLM_SERVICE_NOT_INITIALIZED)
    return llm_service
