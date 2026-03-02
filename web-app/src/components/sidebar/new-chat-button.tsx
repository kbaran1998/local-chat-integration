"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChatContext } from "@/components/chat/chat-context";
import { Button } from "@/components/ui/button";
import { createChat } from "@/lib/api";

export function NewChatButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { upsertChat } = useChatContext();

  const handleClick = async () => {
    if (creating) {
      return;
    }
    setCreating(true);
    try {
      const chat = await createChat();
      if (chat?.id) {
        upsertChat(chat);
        router.push(`/chat/${chat.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button
      aria-label="Start new chat"
      className="flex items-center gap-2"
      disabled={creating}
      onClick={handleClick}
      type="button"
      variant="outline"
    >
      <span aria-hidden>+</span>
      {creating ? "Creating…" : "New chat"}
    </Button>
  );
}
