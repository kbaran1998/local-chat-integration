"use client";

import { ChatProvider } from "@/components/chat/chat-context";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Chat } from "@/types";

interface ChatLayoutClientProps {
  children: React.ReactNode;
  initialChats: Chat[];
}

export function ChatLayoutClient({ children, initialChats }: ChatLayoutClientProps) {
  return (
    <ChatProvider initialChats={initialChats}>
      <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950">
        <aside
          aria-label="Chat list"
          className="flex w-64 shrink-0 flex-col border-zinc-200 border-r bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Chats</h2>
              <ThemeToggle />
            </div>
            <ChatSidebar />
          </div>
        </aside>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </ChatProvider>
  );
}
