/**
 * API route paths derived from the Chat API OpenAPI spec.
 * Use a string for static paths; use a function when the path has path or query params.
 */
export const routes = {
  // Chats
  listChats: "/api/chats",
  createChat: "/api/chats",
  updateChat: (chatId: string) => `/api/chats/${chatId}`,
  deleteChat: (chatId: string) => `/api/chats/${chatId}`,
  listMessages: (chatId: string, pinnedOnly?: boolean) => {
    const base = `/api/chats/${chatId}/messages`;
    if (pinnedOnly === undefined) {
      return base;
    }
    return `${base}?pinned_only=${String(pinnedOnly)}`;
  },
  streamReply: (chatId: string) => `/api/chats/${chatId}/stream`,

  // Messages
  pinMessage: (messageId: string) => `/api/messages/${messageId}/pin`,
  unpinMessage: (messageId: string) => `/api/messages/${messageId}/pin`,
  regenerateReply: (assistantMessageId: string) => `/api/messages/${assistantMessageId}/regenerate`,

  // Health
  healthCheck: "/health",
} as const;
