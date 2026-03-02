"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useChatContext } from "@/components/chat/chat-context";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { deleteChat } from "@/lib/api";
import type { Chat } from "@/types";
import { cn } from "@/utils/cn";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
}

export function ChatItem({ chat, isActive }: ChatItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { chats, removeChat } = useChatContext();
  const liveChat = chats.find((c) => c.id === chat.id) ?? chat;
  const messageCount = liveChat.messageCount;

  const title = liveChat.title ?? "New chat";
  const date = liveChat.updatedAt
    ? new Date(liveChat.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    await deleteChat(chat.id);
    removeChat(chat.id);
    if (pathname === `/chat/${chat.id}`) {
      router.push("/chat");
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-1 rounded-lg pr-1 text-sm transition",
        isActive ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
      )}
    >
      <Link
        aria-current={isActive ? "page" : undefined}
        className="min-w-0 flex-1 px-3 py-2 text-left"
        href={`/chat/${chat.id}`}
      >
        <span className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="mt-0.5 flex flex-nowrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{date}</span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-0.5">
            {messageCount}
            <MessageSquare className="size-3 shrink-0" />
          </span>
        </span>
      </Link>
      <Button
        aria-label={`Delete ${title}`}
        className="mt-1.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
        onClick={handleDeleteClick}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Trash2 aria-hidden />
      </Button>
      <ConfirmModal
        cancelLabel="Cancel"
        confirmLabel="Delete"
        description="Are you sure you want to delete this chat? This cannot be undone."
        onConfirm={handleConfirmDelete}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Delete chat"
        variant="destructive"
      />
    </div>
  );
}
