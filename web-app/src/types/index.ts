export interface Chat {
  id: string;
  messageCount: number;
  title: string | null;
  updatedAt: string | null;
}

export interface ChatListResponse {
  data: Chat[];
}

export interface MessageMeta {
  completionTokens?: number;
  latencyMs?: number;
}

export interface Message {
  content: string;
  createdAt: string | null;
  id: string;
  meta?: MessageMeta | null;
  pinned: boolean;
  role: "user" | "assistant" | "system";
}

export interface MessageListResponse {
  data: Message[];
}
