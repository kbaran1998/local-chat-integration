"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useChatContext } from "@/components/chat/chat-context";
import { ChatStatsBar } from "@/components/chat/chat-stats-bar";
import { Composer } from "@/components/chat/composer";
import { MessageTimeline } from "@/components/chat/message-timeline";
import { pinMessage, unpinMessage } from "@/lib/api";
import type { Message } from "@/types";
import { TOAST_DEFAULT_DURATION_MS, TOAST_DEFAULT_ERROR_DESCRIPTION, TOAST_DEFAULT_POSITION } from "@/utils/constants";

interface ChatIdPageClientProps {
  chatId: string;
  initialMessages: Message[];
}

export function ChatIdPageClient({ chatId, initialMessages }: ChatIdPageClientProps) {
  const { error, hydrateMessages, isStreaming, messages, messagesLoaded, regenerate, sendMessage, setMessagePinned } =
    useChatContext();

  useEffect(() => {
    hydrateMessages(chatId, initialMessages);
  }, [chatId, initialMessages, hydrateMessages]);

  const handlePin = useCallback(
    async (messageId: string) => {
      try {
        await pinMessage(messageId);
        setMessagePinned(messageId, true);
        toast.success("Successfully pinned message", {
          position: TOAST_DEFAULT_POSITION,
          duration: TOAST_DEFAULT_DURATION_MS,
        });
      } catch {
        toast.error("Failed to pin message", {
          description: TOAST_DEFAULT_ERROR_DESCRIPTION,
          position: TOAST_DEFAULT_POSITION,
          duration: TOAST_DEFAULT_DURATION_MS,
        });
      }
    },
    [setMessagePinned]
  );

  const handleUnpin = useCallback(
    async (messageId: string) => {
      try {
        await unpinMessage(messageId);
        setMessagePinned(messageId, false);
        toast.success("Successfully unpinned message", {
          position: TOAST_DEFAULT_POSITION,
          duration: TOAST_DEFAULT_DURATION_MS,
        });
      } catch {
        toast.error("Failed to unpin message", {
          description: TOAST_DEFAULT_ERROR_DESCRIPTION,
          position: TOAST_DEFAULT_POSITION,
          duration: TOAST_DEFAULT_DURATION_MS,
        });
      }
    },
    [setMessagePinned]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatStatsBar />
      {error && (
        <div className="bg-red-100 px-4 py-2 text-red-800 text-sm dark:bg-red-900/30 dark:text-red-200" role="alert">
          {error}
        </div>
      )}
      {messagesLoaded ? (
        <>
          <MessageTimeline
            isStreaming={isStreaming}
            messages={messages}
            onPin={handlePin}
            onRegenerate={regenerate}
            onUnpin={handleUnpin}
          />
          <Composer disabled={isStreaming} onSend={sendMessage} />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Loading messages...</p>
        </div>
      )}
    </div>
  );
}
