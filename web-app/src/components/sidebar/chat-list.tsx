"use client";

import type { Chat } from "@/types";
import { ChatItem } from "./chat-item";

interface ChatListProps {
  activeChatId: string | null;
  chats: Chat[];
}

export function ChatList({ chats, activeChatId }: ChatListProps) {
  if (chats.length === 0) {
    return <p className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">No chats yet. Start a new chat.</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {chats.map((chat) => (
        <li key={chat.id}>
          <ChatItem chat={chat} isActive={chat.id === activeChatId} />
        </li>
      ))}
    </ul>
  );
}
