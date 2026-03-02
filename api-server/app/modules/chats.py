"""Chat business logic: list, create, update, delete."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count

from app.enums.errors import Errors
from app.enums.http_codes import HTTPCode
from app.models import Chat, Message
from app.utils.time import iso_or_none


async def list_chats(session: AsyncSession) -> dict:
    """Return all chats with message count and last updated."""
    stmt = (
        select(
            Chat.id,  # type: ignore[arg-type]
            Chat.title,  # type: ignore[arg-type]
            Chat.updated_at,  # type: ignore[arg-type]
            count(Message.id).label("message_count"),  # type: ignore[arg-type]
        )
        .outerjoin(
            Message,
            Chat.id == Message.chat_id,  # type: ignore[arg-type]
        )
        .group_by(
            Chat.id,
            Chat.title,
            Chat.updated_at,  # type: ignore[arg-type]
        )
        .order_by(desc(Chat.updated_at))  # type: ignore[arg-type]
    )
    result = await session.execute(stmt)
    rows = result.all()
    return {
        "data": [
            {
                "id": str(r.id),
                "title": r.title,
                "updatedAt": iso_or_none(r.updated_at),
                "messageCount": r.message_count or 0,
            }
            for r in rows
        ]
    }


async def create_chat(
    session: AsyncSession,
    title: str | None,
) -> dict:
    """Create a new chat and return its representation."""
    chat = Chat(title=title)
    session.add(chat)
    await session.flush()
    await session.refresh(chat)
    return {
        "id": str(chat.id),
        "title": chat.title,
        "updatedAt": iso_or_none(chat.updated_at),
        "messageCount": 0,
    }


async def update_chat(
    session: AsyncSession,
    chat_id: UUID,
    title: str | None,
) -> dict:
    """Update chat title. Raises 404 if not found."""
    result = await session.execute(
        select(Chat).where(
            Chat.id == chat_id  # type: ignore[arg-type]
        )
    )
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(
            status_code=HTTPCode.NOT_FOUND,
            detail=Errors.CHAT_NOT_FOUND,
        )
    if title is not None:
        chat.title = title
    session.add(chat)
    await session.flush()
    await session.refresh(chat)
    return {
        "id": str(chat.id),
        "title": chat.title,
        "updatedAt": iso_or_none(chat.updated_at),
    }


async def delete_chat(
    session: AsyncSession,
    chat_id: UUID,
) -> None:
    """Delete chat and all its messages. Raises 404 if not found."""
    result = await session.execute(
        select(Chat).where(
            Chat.id == chat_id  # type: ignore[arg-type]
        )
    )
    chat = result.scalars().first()
    if not chat:
        raise HTTPException(
            status_code=HTTPCode.NOT_FOUND,
            detail=Errors.CHAT_NOT_FOUND,
        )
    await session.delete(chat)
    await session.flush()
