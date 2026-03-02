"use client";

import { CopyIcon, PinIcon, RotateCcwIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types";
import { cn } from "@/utils/cn";
import { TOAST_DEFAULT_DURATION_MS, TOAST_DEFAULT_ERROR_DESCRIPTION, TOAST_DEFAULT_POSITION } from "@/utils/constants";

interface MessageCardProps {
  isStreaming?: boolean;
  message: Message;
  onPin?: (messageId: string) => void;
  onRegenerate?: (assistantMessageId: string) => void;
  onUnpin?: (messageId: string) => void;
}

export function MessageCard({ isStreaming = false, message, onPin, onRegenerate, onUnpin }: MessageCardProps) {
  const isUser = message.role === "user";
  const meta = message.meta;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard", {
        position: TOAST_DEFAULT_POSITION,
        duration: TOAST_DEFAULT_DURATION_MS,
      });
    } catch {
      toast.error("Failed to copy message", {
        description: TOAST_DEFAULT_ERROR_DESCRIPTION,
        position: TOAST_DEFAULT_POSITION,
        duration: TOAST_DEFAULT_DURATION_MS,
      });
    }
  }, [message.content]);

  return (
    <article
      aria-label={`${message.role} message`}
      className={cn(
        "rounded-lg border border-l-4 px-4 py-3",
        isUser
          ? "border-l-blue-500 bg-blue-50/50 dark:border-l-blue-400 dark:bg-zinc-800/50"
          : "border-l-zinc-300 bg-white dark:border-l-zinc-600 dark:bg-zinc-800/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">{message.role}</p>
        <div className="flex items-center gap-1">
          <Button aria-label="Copy message to clipboard" onClick={handleCopy} size="xs" type="button" variant="outline">
            <CopyIcon aria-hidden className="size-4 shrink-0" />
            <span>Copy</span>
          </Button>
          {!isUser && onPin && message.pinned && (
            <Button
              aria-label="Unpin message"
              onClick={() => onUnpin?.(message.id)}
              size="xs"
              type="button"
              variant="outline"
            >
              <PinIcon aria-hidden className="size-4 shrink-0" />
              <span>Unpin</span>
            </Button>
          )}
          {!isUser && onPin && !message.pinned && (
            <Button
              aria-label="Pin message"
              onClick={() => onPin(message.id)}
              size="xs"
              type="button"
              variant="outline"
            >
              <PinIcon aria-hidden className="size-4 shrink-0" />
              <span>Pin</span>
            </Button>
          )}
          {!isUser && onRegenerate && !isStreaming && (
            <Button
              aria-label="Regenerate message"
              onClick={() => onRegenerate(message.id)}
              size="xs"
              type="button"
              variant="outline"
            >
              <RotateCcwIcon aria-hidden className="size-4 shrink-0" />
              <span>Regenerate</span>
            </Button>
          )}
        </div>
      </div>
      <div className="wrap-break-word mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
        {message.content}
        {isStreaming && (
          <span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-600 dark:bg-zinc-400" />
        )}
      </div>
      {!isUser && (meta?.latencyMs != null || meta?.completionTokens != null) && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {meta.latencyMs != null && `${(meta.latencyMs / 1000).toFixed(1)}s`}
          {meta.latencyMs != null && meta.completionTokens != null && " · "}
          {meta.completionTokens != null && `${meta.completionTokens} tokens`}
        </p>
      )}
    </article>
  );
}
