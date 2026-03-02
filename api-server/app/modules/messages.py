"""Message business logic: list, stream, pin, regenerate."""

import asyncio
import json
import logging
import time
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import asc, desc, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.event import ServerSentEvent

from app.config import settings
from app.database import async_session_factory
from app.enums.errors import Errors
from app.enums.http_codes import HTTPCode
from app.models import Chat, Message
from app.services import llm as llm_module
from app.utils.time import iso_or_none

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Reusable query helpers
# -----------------------------------------------------------------------------


async def get_message_by_id(
    session: AsyncSession,
    message_id: UUID,
) -> Message | None:
    """Load a message by id. Returns None if not found."""
    result = await session.execute(
        select(Message).where(
            Message.id == message_id  # type: ignore[arg-type]
        )
    )
    return result.scalars().first()


async def get_chat_by_id(
    session: AsyncSession,
    chat_id: UUID,
) -> Chat | None:
    """Load a chat by id. Returns None if not found."""
    result = await session.execute(
        select(Chat).where(
            Chat.id == chat_id  # type: ignore[arg-type]
        )
    )
    return result.scalars().first()


async def get_recent_messages_for_llm(
    session: AsyncSession,
    chat_id: UUID,
    *,
    before_created_at: datetime | None = None,
    limit: int | None = None,
) -> list[dict[str, str]]:
    """
    Load recent messages for a chat as [{"role", "content"}, ...] in chronological order.
    If before_created_at is set, only messages with created_at < before_created_at are included.
    """
    limit = limit if limit is not None else settings.max_recent_messages
    q = (
        select(Message)
        .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
        .order_by(desc(Message.created_at))  # type: ignore[arg-type]
        .limit(limit)
    )
    if before_created_at is not None:
        q = q.where(  # type: ignore[assignment]
            Message.created_at  # type: ignore[arg-type]
            < before_created_at
        )
    result = await session.execute(q)
    recent = list(reversed(result.scalars().all()))
    return [{"role": m.role, "content": m.content} for m in recent]


def message_to_api_dict(msg: Message) -> dict:
    """Serialize a Message to the API response shape."""
    return {
        "id": str(msg.id),
        "role": msg.role,
        "content": msg.content,
        "createdAt": iso_or_none(msg.created_at),
        "pinned": msg.pinned,
        "meta": msg.meta,
    }


# -----------------------------------------------------------------------------
# Reusable stream / persist helpers
# -----------------------------------------------------------------------------


async def stream_llm_tokens(
    messages_for_llm: list[dict[str, str]],
) -> AsyncGenerator[tuple[ServerSentEvent, str], None]:
    """Stream LLM completion; yields (SSE event, token) for each token."""
    svc = llm_module.get_llm_service()
    async for token in svc.stream_completion(messages_for_llm):
        yield (
            ServerSentEvent(data=json.dumps({"t": token}), event="token"),
            token,
        )


async def stream_llm_completion_with_stats(
    messages_for_llm: list[dict[str, str]],
    out: dict[str, str | int],
) -> AsyncGenerator[ServerSentEvent, None]:
    """
    Stream LLM completion; yield token SSE events.
    On completion, set out['content'], out['latency_ms'], out['completion_tokens'].
    """
    full_content: list[str] = []
    t0 = time.perf_counter()
    async for event, token in stream_llm_tokens(messages_for_llm):
        full_content.append(token)
        yield event
    out["latency_ms"] = int((time.perf_counter() - t0) * 1000)
    out["completion_tokens"] = len(full_content)
    out["content"] = "".join(full_content)


async def persist_assistant_message(
    session: AsyncSession,
    chat_id: UUID,
    content: str,
    latency_ms: int,
    completion_tokens: int,
) -> Message:
    """Create, add, flush and refresh an assistant message; return it."""
    msg = Message(
        chat_id=chat_id,
        role="assistant",
        content=content,
        meta={
            "latencyMs": latency_ms,
            "completionTokens": completion_tokens,
        },
    )
    session.add(msg)
    await session.flush()
    await session.refresh(msg)
    return msg


def update_chat_timestamp(
    session: AsyncSession,
    chat: Chat,
    message: Message,
) -> None:
    """Set chat.updated_at from message.created_at and mark chat for update."""
    chat.updated_at = message.created_at or datetime.now(timezone.utc).replace(tzinfo=None)
    session.add(chat)


def sse_error_event(message: str) -> ServerSentEvent:
    """Build an SSE event for an error."""
    return ServerSentEvent(
        data=json.dumps({"message": message}),
        event="error",
    )


# -----------------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------------


async def list_messages(
    session: AsyncSession,
    chat_id: UUID,
    *,
    pinned_only: bool = False,
) -> dict:
    """Return messages for a chat, ordered by created_at. If pinned_only, only pinned messages."""
    query = (
        select(Message)
        .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
        .order_by(asc(Message.created_at))  # type: ignore[arg-type]
    )
    if pinned_only:
        query = query.where(Message.pinned)  # type: ignore[assignment]
    result = await session.execute(query)

    messages = result.scalars().all()
    return {"data": [message_to_api_dict(msg) for msg in messages]}


async def stream_reply(
    session: AsyncSession,
    chat_id: UUID,
    content: str,
) -> AsyncGenerator[ServerSentEvent, None]:
    """Insert user message, stream assistant reply, update chat."""
    try:
        chat = await get_chat_by_id(session, chat_id)
        if not chat:
            raise HTTPException(
                status_code=HTTPCode.NOT_FOUND,
                detail=Errors.CHAT_NOT_FOUND,
            )

        # Insert user message
        user_msg = Message(
            chat_id=chat_id,
            role="user",
            content=content,
        )
        session.add(user_msg)
        await session.flush()

        messages_for_llm = await get_recent_messages_for_llm(session, chat_id)
        completion_out: dict[str, str | int] = {}
        async for event in stream_llm_completion_with_stats(messages_for_llm, completion_out):
            yield event
        assistant_content = str(completion_out["content"])
        latency_ms = int(completion_out["latency_ms"])
        completion_tokens = int(completion_out["completion_tokens"])

        assistant_msg = await persist_assistant_message(
            session, chat_id, assistant_content, latency_ms, completion_tokens
        )
        update_chat_timestamp(session, chat, assistant_msg)

        new_title: str | None = None
        if not chat.title and assistant_content:
            new_title = await generate_title(content, assistant_content)
            if new_title:
                chat.title = new_title
                session.add(chat)

        await session.commit()

        yield ServerSentEvent(
            data=json.dumps(
                {
                    "assistantMessageId": str(assistant_msg.id),
                    "chatTitle": new_title,
                    "meta": assistant_msg.meta,
                }
            ),
            event="done",
        )
    except (SQLAlchemyError, RuntimeError) as e:
        await session.rollback()
        yield sse_error_event(str(e))


async def generate_title(
    user_content: str,
    assistant_content: str,
) -> str | None:
    """Generate a short chat title from the first exchange."""
    title_prompt = [
        {
            "role": "user",
            "content": (
                f"Conversation:\nUser: {user_content[:200]}\n"
                f"Assistant: {assistant_content[:300]}\n\n"
                "Give a 3 to 5 word title for this chat. "
                "Reply with only the title, no quotes."
            ),
        },
    ]
    title: str | None = None
    try:
        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(
            None,
            lambda: llm_module.get_llm_service().generate_non_streaming(
                title_prompt, max_new_tokens=24
            ),
        )
        title = raw.split("\n")[0].strip()[:80]
    except (RuntimeError, OSError) as e:
        logger.warning("Title generation failed: %s", e)
    return title or None


async def set_pin(
    session: AsyncSession,
    message_id: UUID,
    pinned: bool,
) -> dict:
    """Pin or unpin a message. Raises 404 if not found."""
    msg = await get_message_by_id(session, message_id)
    if not msg:
        raise HTTPException(
            status_code=HTTPCode.NOT_FOUND,
            detail=Errors.MESSAGE_NOT_FOUND,
        )
    msg.pinned = pinned
    session.add(msg)
    await session.commit()
    return {"id": str(msg.id), "pinned": pinned}


async def regenerate_reply(
    assistant_message_id: UUID,
) -> AsyncGenerator[ServerSentEvent, None]:
    """Regenerate the assistant reply for the preceding user message."""
    async with async_session_factory() as session:
        try:
            assistant_msg = await get_message_by_id(session, assistant_message_id)
            if not assistant_msg or assistant_msg.role != "assistant":
                yield sse_error_event("Assistant message not found")
                return

            chat_id = assistant_msg.chat_id

            # Find preceding user message
            result = await session.execute(
                select(Message)
                .where(
                    Message.chat_id == chat_id,  # type: ignore[arg-type]
                    Message.created_at  # type: ignore[arg-type]
                    < assistant_msg.created_at,
                )
                .order_by(
                    desc(Message.created_at)  # type: ignore[arg-type]
                )
                .limit(1),
            )
            user_msg = result.scalars().first()
            if not user_msg or user_msg.role != "user":
                yield sse_error_event("No user message to regenerate from")
                return

            content = user_msg.content
            messages_for_llm = await get_recent_messages_for_llm(
                session,
                chat_id,
                before_created_at=user_msg.created_at,
                limit=settings.max_recent_messages - 1,
            )
            messages_for_llm.append({"role": "user", "content": content})

            completion_out: dict[str, str | int] = {}
            async for event in stream_llm_completion_with_stats(messages_for_llm, completion_out):
                yield event
            assistant_content = str(completion_out["content"])
            latency_ms = int(completion_out["latency_ms"])
            completion_tokens = int(completion_out["completion_tokens"])

            new_assistant = await persist_assistant_message(
                session, chat_id, assistant_content, latency_ms, completion_tokens
            )
            chat = await get_chat_by_id(session, chat_id)
            if chat:
                update_chat_timestamp(session, chat, new_assistant)

            await session.commit()
            yield ServerSentEvent(
                data=json.dumps(
                    {
                        "assistantMessageId": str(new_assistant.id),
                        "meta": new_assistant.meta,
                    }
                ),
                event="done",
            )
        except (SQLAlchemyError, RuntimeError) as e:
            await session.rollback()
            yield sse_error_event(str(e))
