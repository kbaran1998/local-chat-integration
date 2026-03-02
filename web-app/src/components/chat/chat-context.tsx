"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { fetchChats, fetchMessages } from "@/lib/api";
import type { Chat, Message } from "@/types";

interface ChatContextValue {
  activeChat: Chat | null;
  activeChatId: string | null;
  activeChatMessageCount: number;
  activeChatTokenTotal: number;
  chats: Chat[];
  error: string | null;
  hydrateMessages: (chatId: string, messages: Message[]) => void;
  isStreaming: boolean;
  messages: Message[];
  messagesLoaded: boolean;
  refreshChats: () => Promise<void>;
  regenerate: (assistantMessageId: string) => Promise<void>;
  removeChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  setMessagePinned: (messageId: string, pinned: boolean) => void;
  updateChatMeta: (chatId: string, partial: Partial<Chat>) => void;
  upsertChat: (chat: Chat) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  initialChats?: Chat[];
}

export function ChatProvider({ children, initialChats = [] }: ChatProviderProps) {
  const pathname = usePathname();
  const activeChatId =
    pathname?.startsWith("/chat/") && pathname !== "/chat" ? pathname.replace("/chat/", "").split("/")[0] : null;

  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const hydratedChatIdRef = useRef<string | null>(null);
  const hasInitialChats = useRef(Boolean(initialChats.length > 0));

  const { error, isStreaming, messages, regenerate, sendMessage, setMessages, setOnAssistantDone } = useChatStream(
    activeChatId,
    []
  );

  const refreshChats = useCallback(async () => {
    try {
      const data = await fetchChats();
      setChats(data);
    } catch {
      setChats([]);
    }
  }, []);

  const hydrateMessages = useCallback(
    (chatId: string, messages: Message[]) => {
      setMessages(messages);
      setMessagesLoaded(true);
      hydratedChatIdRef.current = chatId;
    },
    [setMessages]
  );

  useEffect(() => {
    if (!hasInitialChats.current) {
      refreshChats().catch(() => undefined);
    }
  }, [refreshChats]);

  useEffect(() => {
    if (!activeChatId || activeChatId === "null") {
      setMessages([]);
      setMessagesLoaded(true);
      hydratedChatIdRef.current = null;
      return;
    }

    let cancelled = false;
    hydratedChatIdRef.current = null;
    setMessagesLoaded(false);

    (async () => {
      try {
        const data = await fetchMessages(activeChatId);
        if (!cancelled && hydratedChatIdRef.current !== activeChatId) {
          setMessages(data);
        }
      } catch {
        if (!cancelled && hydratedChatIdRef.current !== activeChatId) {
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setMessagesLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatId, setMessages]);

  useEffect(() => {
    setOnAssistantDone((streamChatId, _assistantMessageId, chatTitle, _meta) => {
      if (!streamChatId || streamChatId === "null" || streamChatId === "undefined") {
        return;
      }
      setChats((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === streamChatId);
        if (existingIndex === -1) {
          return [
            {
              id: streamChatId,
              messageCount: 1,
              title: chatTitle ?? null,
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          messageCount: existing.messageCount + 1,
          title: chatTitle ?? existing.title,
          updatedAt: new Date().toISOString(),
        };
        return next;
      });
    });
  }, [setOnAssistantDone]);

  const upsertChat = useCallback((chat: Chat) => {
    setChats((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === chat.id);
      if (existingIndex === -1) {
        return [chat, ...prev];
      }
      const next = [...prev];
      next[existingIndex] = chat;
      return next;
    });
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
  }, []);

  const updateChatMeta = useCallback((chatId: string, partial: Partial<Chat>) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, ...partial, id: chat.id } : chat)));
  }, []);

  const setMessagePinned = useCallback(
    (messageId: string, pinned: boolean) => {
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, pinned } : msg)));
    },
    [setMessages]
  );

  const chatsForDisplay = useMemo(() => chats.filter((c) => c.id && c.id !== "null" && c.id !== "undefined"), [chats]);

  const activeChat = useMemo(
    () =>
      activeChatId && activeChatId !== "null" && activeChatId !== "undefined"
        ? (chatsForDisplay.find((chat) => chat.id === activeChatId) ?? null)
        : null,
    [activeChatId, chatsForDisplay]
  );

  const activeChatMessageCount = useMemo(
    () => (activeChatId ? messages.filter((m) => m.role !== "system").length : 0),
    [activeChatId, messages]
  );

  const activeChatTokenTotal = useMemo(
    () =>
      messages.reduce((total, message) => {
        if (message.role !== "assistant") {
          return total;
        }
        const tokens = message.meta?.completionTokens ?? 0;
        return total + tokens;
      }, 0),
    [messages]
  );

  const value: ChatContextValue = useMemo(
    () => ({
      chats: chatsForDisplay,
      activeChatId,
      activeChat,
      messages,
      isStreaming,
      error,
      messagesLoaded,
      hydrateMessages,
      sendMessage,
      regenerate,
      refreshChats,
      upsertChat,
      removeChat,
      updateChatMeta,
      setMessagePinned,
      activeChatMessageCount,
      activeChatTokenTotal,
    }),
    [
      activeChat,
      activeChatId,
      activeChatMessageCount,
      activeChatTokenTotal,
      chatsForDisplay,
      error,
      hydrateMessages,
      isStreaming,
      messages,
      messagesLoaded,
      refreshChats,
      regenerate,
      removeChat,
      sendMessage,
      setMessagePinned,
      updateChatMeta,
      upsertChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}
