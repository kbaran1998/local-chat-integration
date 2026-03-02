"""Message list and SSE stream endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_session
from app.enums.errors import Errors
from app.enums.http_codes import HTTPCode
from app.enums.schemas import (
    ErrorDetail,
    MessageListResponse,
    PinResponse,
    StreamMessageBody,
)
from app.modules import messages as msg_module

router = APIRouter()
_session_dep = Depends(get_session)

_SSE_STREAM_DESCRIPTION = """\
The response is a **Server-Sent Events** (SSE) stream
(`text/event-stream`).

#### Event types

| event   | payload | description |
|---------|---------|-------------|
| `token` | `{SSETokenEvent.model_json_schema()}` | \
A single generated token. |
| `done`  | See *done* schema below. | \
Sent once after the last token. |
| `error` | `{SSEErrorEvent.model_json_schema()}` | \
Sent if an error occurs during generation. |
"""

_SSE_STREAM_RESPONSES: dict[int | str, dict] = {
    HTTPCode.OK: {
        "description": (
            "SSE stream. Events: "
            "`token` (generated token), "
            "`done` (completion metadata), "
            "`error` (on failure)."
        ),
        "content": {
            "text/event-stream": {
                "schema": {
                    "type": "string",
                    "description": ("Server-Sent Events stream."),
                },
                "examples": {
                    "token": {
                        "summary": "token event",
                        "value": ('event: token\ndata: {"t": "Paris"}\n\n'),
                    },
                    "done": {
                        "summary": "done event",
                        "value": (
                            "event: done\n"
                            "data: {"
                            '"assistantMessageId": '
                            '"c3d4e5f6-a7b8-9012-cdef-123456789012",'
                            ' "chatTitle": "French capital", '
                            '"meta": {"latencyMs": 320, '
                            '"completionTokens": 42}'
                            "}\n\n"
                        ),
                    },
                    "error": {
                        "summary": "error event",
                        "value": ('event: error\ndata: {"message": "LLM not loaded."}\n\n'),
                    },
                },
            },
        },
    },
}


@router.get(
    "/chats/{chat_id}/messages",
    response_model=MessageListResponse,
    summary="List messages",
    description=(
        "Return all messages for a chat, "
        "ordered by creation time (oldest first). "
        "Each message includes its role, content, pin state, "
        "and optional generation metadata. "
        "Use `pinned_only=true` to return only pinned messages."
    ),
    operation_id="listMessages",
    responses={
        HTTPCode.NOT_FOUND: {
            "description": Errors.CHAT_NOT_FOUND,
            "model": ErrorDetail,
        },
    },
)
async def list_messages(
    chat_id: Annotated[
        UUID,
        "Unique identifier of the chat whose messages to retrieve.",
    ],
    session: Annotated[AsyncSession, _session_dep],
    pinned_only: Annotated[
        bool,
        "If true, return only pinned messages. Default is false.",
    ] = False,
) -> dict:
    """Return messages for a chat, ordered by created_at."""
    return await msg_module.list_messages(session, chat_id, pinned_only=pinned_only)


@router.post(
    "/chats/{chat_id}/stream",
    summary="Send message and stream reply",
    description=(
        "Persist the user message, run the local LLM, "
        "and stream the assistant's reply token-by-token "
        "as Server-Sent Events.\n\n"
        "After all tokens are emitted a `done` event is sent "
        "containing the persisted assistant message ID, "
        "an auto-generated chat title (first exchange only), "
        "and generation metadata (latency, token count).\n\n"
        "If an error occurs mid-stream an `error` event is "
        "emitted and the database transaction is rolled back."
    ),
    operation_id="streamReply",
    responses={
        **_SSE_STREAM_RESPONSES,
        HTTPCode.BAD_REQUEST: {
            "description": Errors.CONTENT_REQUIRED,
            "model": ErrorDetail,
        },
        HTTPCode.NOT_FOUND: {
            "description": Errors.CHAT_NOT_FOUND,
            "model": ErrorDetail,
        },
    },
)
async def stream_reply(
    chat_id: Annotated[
        UUID,
        "Unique identifier of the chat to send a message to.",
    ],
    body: StreamMessageBody,
    session: Annotated[AsyncSession, _session_dep],
) -> EventSourceResponse:
    """Send user message, stream assistant reply via SSE."""
    content = body.content.strip()
    if not content:
        raise HTTPException(
            status_code=HTTPCode.BAD_REQUEST,
            detail=Errors.CONTENT_REQUIRED,
        )
    return EventSourceResponse(msg_module.stream_reply(session, chat_id, content))


@router.post(
    "/messages/{message_id}/pin",
    response_model=PinResponse,
    summary="Pin a message",
    description=("Mark a message as pinned so it is highlighted in the conversation UI."),
    operation_id="pinMessage",
    responses={
        HTTPCode.NOT_FOUND: {
            "description": Errors.MESSAGE_NOT_FOUND,
            "model": ErrorDetail,
        },
    },
)
async def pin_message(
    message_id: Annotated[
        UUID,
        "Unique identifier of the message to pin.",
    ],
    session: Annotated[AsyncSession, _session_dep],
) -> dict:
    """Pin a message."""
    return await msg_module.set_pin(session, message_id, pinned=True)


@router.delete(
    "/messages/{message_id}/pin",
    response_model=PinResponse,
    summary="Unpin a message",
    description="Remove the pinned flag from a message.",
    operation_id="unpinMessage",
    responses={
        HTTPCode.NOT_FOUND: {
            "description": Errors.MESSAGE_NOT_FOUND,
            "model": ErrorDetail,
        },
    },
)
async def unpin_message(
    message_id: Annotated[
        UUID,
        "Unique identifier of the message to unpin.",
    ],
    session: Annotated[AsyncSession, _session_dep],
) -> dict:
    """Unpin a message."""
    return await msg_module.set_pin(session, message_id, pinned=False)


@router.post(
    "/messages/{assistant_message_id}/regenerate",
    summary="Regenerate assistant reply",
    description=(
        "Discard the existing assistant reply and re-run the LLM "
        "from the preceding user message. "
        "The new response is streamed as Server-Sent Events "
        "identical to the stream endpoint.\n\n"
        "The original assistant message is **not** deleted; "
        "a new message is created instead."
    ),
    operation_id="regenerateReply",
    responses=_SSE_STREAM_RESPONSES,
)
async def regenerate_reply(
    assistant_message_id: Annotated[
        UUID,
        "UUID of the assistant message to regenerate.",
    ],
) -> EventSourceResponse:
    """Regenerate the assistant reply (SSE)."""
    return EventSourceResponse(msg_module.regenerate_reply(assistant_message_id))
