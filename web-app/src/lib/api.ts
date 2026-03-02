import { toast } from "sonner";
import { routes } from "@/lib/api-routes";
import type { Chat, ChatListResponse, Message, MessageListResponse } from "@/types";
import { TOAST_DEFAULT_DURATION_MS, TOAST_DEFAULT_ERROR_DESCRIPTION, TOAST_DEFAULT_POSITION } from "@/utils/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchChats(): Promise<Chat[]> {
  const res = await fetch(`${API_URL}${routes.listChats}`);
  if (!res.ok) {
    toast.error("Failed to fetch chats", { description: "Please try again later", position: "top-right" });
    return [];
  }
  const json = (await res.json()) as ChatListResponse;
  if (!Array.isArray(json.data)) {
    return [];
  }
  return json.data;
}

export async function createChat(title?: string | null): Promise<Chat | null> {
  const res = await fetch(`${API_URL}${routes.createChat}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title ?? null }),
  });
  if (!res.ok) {
    toast.error("Failed to create chat", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    return null;
  }
  const data = (await res.json()) as Chat;
  return data;
}

export async function deleteChat(chatId: string): Promise<void> {
  const res = await fetch(`${API_URL}${routes.deleteChat(chatId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    toast.error("Failed to delete chat", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
  }
}

export async function pinMessage(messageId: string): Promise<void> {
  const res = await fetch(`${API_URL}${routes.pinMessage(messageId)}`, {
    method: "POST",
  });
  if (!res.ok) {
    toast.error("Failed to pin message", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
  }
}

export async function unpinMessage(messageId: string): Promise<void> {
  const res = await fetch(`${API_URL}${routes.unpinMessage(messageId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    toast.error("Failed to unpin message", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
  }
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}${routes.listMessages(chatId)}`);
  if (!res.ok) {
    toast.error("Failed to fetch messages", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    return [];
  }
  const json = (await res.json()) as MessageListResponse;
  if (!Array.isArray(json.data)) {
    toast.error("Failed to fetch messages", {
      description: TOAST_DEFAULT_ERROR_DESCRIPTION,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    return [];
  }
  return json.data;
}

export interface MessageMeta {
  completionTokens?: number;
  latencyMs?: number;
}

export interface StreamCallbacks {
  onDone: (
    assistantMessageId: string,
    chatTitle?: string,
    meta?: { latencyMs?: number; completionTokens?: number }
  ) => void;
  onError: (errorMessage: string) => void;
  onToken: (token: string) => void;
}

function parseSSEData(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast.error("Failed to parse SSE data", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    return null;
  }
}

function dispatchSSEEvent(event: string, data: string, callbacks: StreamCallbacks): void {
  const parsed = parseSSEData(data);
  if (!parsed) {
    return;
  }
  if (event === "token" && typeof parsed.t === "string") {
    callbacks.onToken(parsed.t);
  } else if (event === "done" && typeof parsed.assistantMessageId === "string") {
    const chatTitle = typeof parsed.chatTitle === "string" ? parsed.chatTitle : undefined;
    const meta =
      parsed.meta && typeof parsed.meta === "object" && !Array.isArray(parsed.meta)
        ? (parsed.meta as { latencyMs?: number; completionTokens?: number })
        : undefined;
    callbacks.onDone(parsed.assistantMessageId, chatTitle, meta);
  } else if (event === "error" && typeof parsed.message === "string") {
    const errorMessage = parsed.message;
    toast.error("Failed to dispatch SSE event", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    callbacks.onError(errorMessage);
  }
}

function processSSEBuffer(buffer: string, callbacks: StreamCallbacks): string {
  const lines = buffer.split("\n");
  let lastEvent = "";
  for (const line of lines) {
    if (line.startsWith("event:")) {
      lastEvent = line.slice(6).trim();
    } else if (line.startsWith("data:") && lastEvent) {
      dispatchSSEEvent(lastEvent, line.slice(5).trim(), callbacks);
      lastEvent = "";
    }
  }
  const lastNewline = buffer.lastIndexOf("\n");
  return lastNewline >= 0 ? buffer.slice(lastNewline + 1) : buffer;
}

export async function streamMessage(chatId: string, content: string, callbacks: StreamCallbacks): Promise<void> {
  const res = await fetch(`${API_URL}${routes.streamReply(chatId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errorMessage = `Request failed: ${res.statusText}`;
    toast.error("Failed to stream message", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    callbacks.onError(errorMessage);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    const errorMessage = "No response body";
    toast.error("Failed to stream message", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    callbacks.onError(errorMessage);
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    buffer = processSSEBuffer(buffer, callbacks);
  }
  if (buffer) {
    processSSEBuffer(`${buffer}\n`, callbacks);
  }
}

export async function streamRegenerate(assistantMessageId: string, callbacks: StreamCallbacks): Promise<void> {
  const res = await fetch(`${API_URL}${routes.regenerateReply(assistantMessageId)}`, { method: "POST" });
  if (!res.ok) {
    const errorMessage = `Request failed: ${res.statusText}`;
    toast.error("Failed to regenerate message", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    callbacks.onError(errorMessage);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    const errorMessage = "No response body";
    toast.error("Failed to regenerate message", {
      description: errorMessage,
      position: TOAST_DEFAULT_POSITION,
      duration: TOAST_DEFAULT_DURATION_MS,
    });
    callbacks.onError(errorMessage);
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    buffer = processSSEBuffer(buffer, callbacks);
  }
  if (buffer) {
    processSSEBuffer(`${buffer}\n`, callbacks);
  }
}
