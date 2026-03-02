/**
 * Server-only API helpers for data fetching. No toast or client-only code.
 * Use from Server Components and server actions.
 */
import { routes } from "@/lib/api-routes";
import type { Chat, ChatListResponse, Message, MessageListResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getChats(): Promise<Chat[]> {
  const res = await fetch(`${API_URL}${routes.listChats}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return [];
  }
  const json = (await res.json()) as ChatListResponse;
  if (!Array.isArray(json.data)) {
    return [];
  }
  return json.data;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}${routes.listMessages(chatId)}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return [];
  }
  const json = (await res.json()) as MessageListResponse;
  if (!Array.isArray(json.data)) {
    return [];
  }
  return json.data;
}

export async function createChatServer(title?: string | null): Promise<Chat | null> {
  const res = await fetch(`${API_URL}${routes.createChat}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title ?? null }),
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as Chat;
  return data;
}
