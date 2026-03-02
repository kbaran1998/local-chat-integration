"use client";

import { useChatContext } from "@/components/chat/chat-context";

export function ChatStatsBar() {
  const { activeChat, activeChatMessageCount, activeChatTokenTotal } = useChatContext();

  if (!activeChat) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-zinc-200 border-b bg-zinc-50 px-4 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
      <span className="truncate">
        <span className="font-medium">Messages:</span> {activeChatMessageCount}
      </span>
      <span className="truncate">
        <span className="font-medium">Completion tokens:</span> {activeChatTokenTotal}
      </span>
    </div>
  );
}
