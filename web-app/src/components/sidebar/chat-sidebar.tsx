"use client";

import { useChatContext } from "@/components/chat/chat-context";
import { ChatList } from "./chat-list";
import { NewChatButton } from "./new-chat-button";

export function ChatSidebar() {
  const { activeChatId, chats } = useChatContext();

  return (
    <>
      <NewChatButton />
      <ChatList activeChatId={activeChatId} chats={chats} />
    </>
  );
}
