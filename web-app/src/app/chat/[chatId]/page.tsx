import { ChatIdPageClient } from "@/components/chat/chat-id-page-client";
import { getMessages } from "@/lib/server-api";

interface ChatIdPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { chatId } = await params;
  const initialMessages = await getMessages(chatId);
  return <ChatIdPageClient chatId={chatId} initialMessages={initialMessages} />;
}
