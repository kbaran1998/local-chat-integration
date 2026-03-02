"""Message model."""

import uuid
from datetime import datetime, timezone
from typing import ClassVar

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    """Message model."""

    __tablename__: ClassVar[str] = "messages"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chat_id: uuid.UUID = Field(foreign_key="chats.id")
    role: str = Field(max_length=32)  # user | assistant | system
    content: str = Field()
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    pinned: bool = Field(default=False)
    meta: dict | None = Field(default=None, sa_column=Column(JSON))
