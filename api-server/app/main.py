"""FastAPI app: lifespan, CORS, routers."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.database import engine
from app.enums.errors import Errors
from app.enums.http_codes import HTTPCode
from app.enums.schemas import ErrorDetail, HealthResponse
from app.routers import chats, messages
from app.services import llm as llm_module
from app.services.llm import LLMService

logger = logging.getLogger(__name__)
llm_service = LLMService()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load LLM and create DB tables on startup.

    Raises:
        HTTPException: If the server is not healthy.
    Returns:
        dict[str, str]: A dictionary with the status of the server.
    """
    # Create tables (optional: server still starts if DB is unavailable)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    except OSError as e:
        logger.warning("Database unavailable at startup (tables not created): %s", e)

    # Load model (can be slow)
    llm_service.load()
    llm_module.llm_service = llm_service
    yield


_OPENAPI_TAGS = [
    {
        "name": "chats",
        "description": "Create, list, update, and delete chat sessions.",
    },
    {
        "name": "messages",
        "description": (
            "Read messages, stream LLM replies, pin/unpin messages, and regenerate responses."
        ),
    },
    {
        "name": "health",
        "description": "Server health and readiness checks.",
    },
]

app = FastAPI(
    title="Chat API",
    description=(
        "Backend for a local chat application powered by "
        "a Hugging Face language model. "
        "Provides CRUD for chat sessions, message storage, "
        "and real-time SSE streaming of model completions."
    ),
    version="0.1.0",
    openapi_tags=_OPENAPI_TAGS,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["GET", "POST", "PATCH", "DELETE"],
)

app.include_router(chats.router, prefix="/api", tags=["chats"])
app.include_router(messages.router, prefix="/api", tags=["messages"])


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns `healthy` when the LLM model is loaded and the server is ready to accept requests."
    ),
    operation_id="healthCheck",
    tags=["health"],
    responses={
        HTTPCode.SERVICE_UNAVAILABLE: {
            "description": Errors.LLM_NOT_LOADED,
            "model": ErrorDetail,
        },
    },
)
async def health_check() -> dict[str, str]:
    """Check if the server is healthy."""
    if not llm_service.is_loaded():
        raise HTTPException(
            status_code=HTTPCode.SERVICE_UNAVAILABLE,
            detail=Errors.LLM_NOT_LOADED,
        )
    return {"status": "healthy"}
