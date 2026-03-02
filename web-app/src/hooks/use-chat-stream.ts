"use client";

import { useCallback, useState } from "react";
import { streamMessage, streamRegenerate } from "@/lib/api";
import type { Message } from "@/types";

export interface UseChatStreamResult {
  error: string | null;
  isStreaming: boolean;
  messages: Message[];
  regenerate: (assistantMessageId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setOnAssistantDone: (
    handler:
      | ((
          streamChatId: string,
          assistantMessageId: string,
          chatTitle?: string,
          meta?: { latencyMs?: number; completionTokens?: number }
        ) => void)
      | null
  ) => void;
}

export function useChatStream(chatId: string | null, initialMessages: Message[]): UseChatStreamResult {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onAssistantDone, setOnAssistantDone] = useState<
    | ((
        streamChatId: string,
        assistantMessageId: string,
        chatTitle?: string,
        meta?: { latencyMs?: number; completionTokens?: number }
      ) => void)
    | null
  >(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatId) {
        return;
      }
      setError(null);
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        pinned: false,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      const streamingId = `streaming-${Date.now()}`;
      let assistantContent = "";
      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
          pinned: false,
        },
      ]);
      await streamMessage(chatId, content, {
        onToken(token) {
          assistantContent += token;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamingId ? { ...msg, content: assistantContent } : msg))
          );
        },
        onDone(assistantMessageId, chatTitle, meta) {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId
                ? {
                    ...m,
                    id: assistantMessageId,
                    content: assistantContent,
                    meta: meta ?? undefined,
                  }
                : m
            )
          );
          if (onAssistantDone) {
            onAssistantDone(chatId, assistantMessageId, chatTitle, meta);
          }
        },
        onError(msg) {
          setError(msg);
          setIsStreaming(false);
          setMessages((prev) => prev.filter((message) => message.id !== streamingId));
        },
      });
    },
    [chatId, onAssistantDone]
  );

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (!chatId) {
        return;
      }
      setError(null);
      setIsStreaming(true);
      const streamingId = `regenerate-${Date.now()}`;
      let assistantContent = "";
      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
          pinned: false,
        },
      ]);
      await streamRegenerate(assistantMessageId, {
        onToken(t) {
          assistantContent += t;
          setMessages((prev) =>
            prev.map((message) => (message.id === streamingId ? { ...message, content: assistantContent } : message))
          );
        },
        onDone(newId, _chatTitle, meta) {
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === streamingId
                ? {
                    ...message,
                    id: newId,
                    content: assistantContent,
                    meta: meta ?? undefined,
                  }
                : message
            )
          );
        },
        onError(msg) {
          setError(msg);
          setIsStreaming(false);
          setMessages((prev) => prev.filter((message) => message.id !== streamingId));
        },
      });
    },
    [chatId]
  );

  const setMessagesState = useCallback((arg: Message[] | ((prev: Message[]) => Message[])) => {
    setMessages(arg);
  }, []);

  return {
    error,
    messages,
    isStreaming,
    regenerate,
    sendMessage,
    setMessages: setMessagesState,
    setOnAssistantDone,
  };
}
