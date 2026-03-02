"""Chat CRUD: list, create, update, delete."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.enums.errors import Errors
from app.enums.http_codes import HTTPCode
from app.enums.schemas import (
    ChatDetail,
    ChatListResponse,
    CreateChatBody,
    ErrorDetail,
    UpdateChatBody,
)
from app.modules import chats as chat_module

router = APIRouter(prefix="/chats")

_session_dep = Depends(get_session)


@router.get(
    "",
    response_model=ChatListResponse,
    summary="List chats",
    description=(
        "Return every chat session ordered by most recently updated. "
        "Each item includes the chat title, the last-activity timestamp, "
        "and the total number of messages."
    ),
    operation_id="listChats",
)
async def list_chats(
    session: Annotated[AsyncSession, _session_dep],
) -> dict:
    """List all chats with message count and last updated."""
    return await chat_module.list_chats(session)


@router.post(
    "",
    response_model=ChatDetail,
    status_code=HTTPCode.CREATED,
    summary="Create a chat",
    description=(
        "Start a new chat session. "
        "An optional title may be supplied; if omitted the server "
        "will auto-generate one after the first assistant reply."
    ),
    operation_id="createChat",
)
async def create_chat(
    session: Annotated[AsyncSession, _session_dep],
    body: Annotated[CreateChatBody, Body(default_factory=CreateChatBody)],
) -> dict:
    """Create a new chat."""
    return await chat_module.create_chat(session, body.title)


@router.patch(
    "/{chat_id}",
    response_model=ChatDetail,
    summary="Update a chat",
    description="Update the title of an existing chat session.",
    operation_id="updateChat",
    responses={
        HTTPCode.NOT_FOUND: {
            "description": Errors.CHAT_NOT_FOUND,
            "model": ErrorDetail,
        },
    },
)
async def update_chat(
    chat_id: Annotated[
        uuid.UUID,
        "Unique identifier of the chat to update.",
    ],
    body: UpdateChatBody,
    session: Annotated[AsyncSession, _session_dep],
) -> dict:
    """Update chat title."""
    return await chat_module.update_chat(session, chat_id, body.title)


@router.delete(
    "/{chat_id}",
    status_code=HTTPCode.NO_CONTENT,
    summary="Delete a chat",
    description=(
        "Permanently delete a chat session and all of its messages. This action cannot be undone."
    ),
    operation_id="deleteChat",
    responses={
        HTTPCode.NOT_FOUND: {
            "description": Errors.CHAT_NOT_FOUND,
            "model": ErrorDetail,
        },
        HTTPCode.NO_CONTENT: {
            "description": "Chat deleted successfully.",
        },
    },
)
async def delete_chat(
    chat_id: Annotated[
        uuid.UUID,
        "Unique identifier of the chat to delete.",
    ],
    session: Annotated[AsyncSession, _session_dep],
) -> None:
    """Delete chat and all its messages."""
    await chat_module.delete_chat(session, chat_id)
