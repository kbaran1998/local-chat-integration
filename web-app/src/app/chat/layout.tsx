import { ChatLayoutClient } from "@/components/chat/chat-layout-client";
import { getChats } from "@/lib/server-api";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const initialChats = await getChats();
  return <ChatLayoutClient initialChats={initialChats}>{children}</ChatLayoutClient>;
}
