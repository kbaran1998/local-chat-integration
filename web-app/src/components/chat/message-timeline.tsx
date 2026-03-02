"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import { MessageCard } from "./message-card";

interface MessageTimelineProps {
  isStreaming: boolean;
  messages: Message[];
  onPin?: (messageId: string) => void;
  onRegenerate?: (assistantMessageId: string) => void;
  onUnpin?: (messageId: string) => void;
}

export function MessageTimeline({ isStreaming, messages, onPin, onRegenerate, onUnpin }: MessageTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
        <p className="text-sm">No messages yet.</p>
        <p className="text-xs">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <ol className="flex flex-col gap-4">
        {messages.map((msg) => (
          <li key={msg.id}>
            <MessageCard
              isStreaming={isStreaming && msg.role === "assistant" && messages.at(-1)?.id === msg.id}
              message={msg}
              onPin={onPin}
              onRegenerate={onRegenerate}
              onUnpin={onUnpin}
            />
          </li>
        ))}
      </ol>
      <div aria-hidden ref={bottomRef} />
    </div>
  );
}
