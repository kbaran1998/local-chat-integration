"""Request and response schemas for OpenAPI documentation."""

from typing import Any

from pydantic import BaseModel, Field

# ── Error ────────────────────────────────────────────────────────


class ErrorDetail(BaseModel):
    """Standard error envelope returned by all error responses."""

    detail: str = Field(
        ...,
        description="Human-readable error message.",
        examples=["Chat not found."],
    )


# ── Chat request bodies ─────────────────────────────────────────


class CreateChatBody(BaseModel):
    """Body for creating a new chat session."""

    title: str | None = Field(
        default=None,
        description=(
            "Optional title for the chat. "
            "If omitted, a title is auto-generated "
            "after the first assistant reply."
        ),
        max_length=80,
        examples=["Recipe ideas"],
    )


class UpdateChatBody(BaseModel):
    """Body for updating a chat session."""

    title: str | None = Field(
        default=None,
        description="New title for the chat.",
        max_length=80,
        examples=["Weekend trip planning"],
    )


# ── Chat response models ────────────────────────────────────────


class ChatSummary(BaseModel):
    """Single chat item returned in the list endpoint."""

    id: str = Field(
        ...,
        description="UUID of the chat.",
        examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    )
    title: str | None = Field(
        default=None,
        description="Chat title (may be null if not yet generated).",
        examples=["Recipe ideas"],
    )
    updatedAt: str | None = Field(  # noqa: N815
        default=None,
        description="ISO-8601 timestamp of the last activity.",
        examples=["2026-03-03T12:00:00"],
    )
    messageCount: int = Field(  # noqa: N815
        ...,
        description="Total number of messages in the chat.",
        examples=[5],
    )


class ChatListResponse(BaseModel):
    """Paginated list of chat summaries."""

    data: list[ChatSummary] = Field(
        ...,
        description="Ordered list of chats, most recently updated first.",
    )


class ChatDetail(BaseModel):
    """Chat representation returned after create or update."""

    id: str = Field(
        ...,
        description="UUID of the chat.",
        examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    )
    title: str | None = Field(
        default=None,
        description="Chat title.",
        examples=["Recipe ideas"],
    )
    updatedAt: str | None = Field(  # noqa: N815
        default=None,
        description="ISO-8601 timestamp of the last activity.",
        examples=["2026-03-03T12:00:00"],
    )
    messageCount: int | None = Field(  # noqa: N815
        default=None,
        description=("Total message count. Present on creation, absent on update."),
        examples=[0],
    )


# ── Message request bodies ──────────────────────────────────────


class StreamMessageBody(BaseModel):
    """Body for sending a user message and streaming the reply."""

    content: str = Field(
        ...,
        description="User message text. Must not be blank.",
        min_length=1,
        max_length=10000,
        examples=["What is the capital of France?"],
    )


# ── Message response models ─────────────────────────────────────


class MessageMeta(BaseModel):
    """Generation metadata attached to assistant messages."""

    latencyMs: int = Field(  # noqa: N815
        ...,
        description="Wall-clock generation time in milliseconds.",
        examples=[320],
    )
    completionTokens: int = Field(  # noqa: N815
        ...,
        description="Number of tokens produced by the model.",
        examples=[42],
    )


class MessageItem(BaseModel):
    """Single message within a chat."""

    id: str = Field(
        ...,
        description="UUID of the message.",
        examples=["b2c3d4e5-f6a7-8901-bcde-f12345678901"],
    )
    role: str = Field(
        ...,
        description="Author role.",
        examples=["user"],
    )
    content: str = Field(
        ...,
        description="Message body text.",
        examples=["What is the capital of France?"],
    )
    createdAt: str | None = Field(  # noqa: N815
        default=None,
        description="ISO-8601 creation timestamp.",
        examples=["2026-03-03T12:00:00"],
    )
    pinned: bool = Field(
        ...,
        description="Whether the message is pinned.",
        examples=[False],
    )
    meta: MessageMeta | dict[str, Any] | None = Field(
        default=None,
        description=("Generation metadata (assistant messages only). Null for user messages."),
    )


class MessageListResponse(BaseModel):
    """List of messages belonging to a chat."""

    data: list[MessageItem] = Field(
        ...,
        description=("Messages ordered by creation time (oldest first)."),
    )


class PinResponse(BaseModel):
    """Acknowledgement after pinning / unpinning a message."""

    id: str = Field(
        ...,
        description="UUID of the affected message.",
        examples=["b2c3d4e5-f6a7-8901-bcde-f12345678901"],
    )
    pinned: bool = Field(
        ...,
        description="New pin state of the message.",
        examples=[True],
    )


# ── SSE event payloads (documented only, not used as models) ────


class SSETokenEvent(BaseModel):
    """Payload of a ``token`` SSE event during streaming."""

    t: str = Field(
        ...,
        description="A single generated token (or token fragment).",
        examples=["Paris"],
    )


class SSEDoneEvent(BaseModel):
    """Payload of the ``done`` SSE event sent after streaming ends."""

    assistantMessageId: str = Field(  # noqa: N815
        ...,
        description="UUID of the persisted assistant message.",
        examples=["c3d4e5f6-a7b8-9012-cdef-123456789012"],
    )
    chatTitle: str | None = Field(  # noqa: N815
        default=None,
        description=("Auto-generated title (only on the first exchange)."),
        examples=["French capital question"],
    )
    meta: MessageMeta | None = Field(
        default=None,
        description="Generation metadata.",
    )


class SSERegenerateDoneEvent(BaseModel):
    """Payload of the ``done`` SSE event for regeneration."""

    assistantMessageId: str = Field(  # noqa: N815
        ...,
        description="UUID of the new assistant message.",
        examples=["d4e5f6a7-b8c9-0123-defa-234567890123"],
    )
    meta: MessageMeta | None = Field(
        default=None,
        description="Generation metadata.",
    )


class SSEErrorEvent(BaseModel):
    """Payload of an ``error`` SSE event."""

    message: str = Field(
        ...,
        description="Human-readable error message.",
        examples=["LLM not loaded."],
    )


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str = Field(
        ...,
        description="Server health status.",
        examples=["healthy"],
    )
