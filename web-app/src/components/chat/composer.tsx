"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { TOAST_DEFAULT_DURATION_MS, TOAST_DEFAULT_POSITION } from "@/utils/constants";

interface ComposerProps {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
}

export function Composer({ onSend, disabled = false }: ComposerProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: { preventDefault(): void }) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled || isSubmitting) {
        return;
      }
      setValue("");

      setIsSubmitting(true);
      try {
        await onSend(trimmed);
      } finally {
        setIsSubmitting(false);
      }
    },
    [value, disabled, isSubmitting, onSend]
  );

  const handleKeyDown = useCallback(
    async (e: { key: string; shiftKey: boolean; preventDefault(): void }) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        try {
          await handleSubmit(e);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          toast.error("Validation error", {
            description: errorMessage,
            position: TOAST_DEFAULT_POSITION,
            duration: TOAST_DEFAULT_DURATION_MS,
          });
        }
      }
    },
    [handleSubmit]
  );

  return (
    <form
      className="shrink-0 border-zinc-200 border-t bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-2">
        <textarea
          aria-label="Message input"
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
          disabled={disabled || isSubmitting}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          value={value}
        />
        <button
          aria-label="Send message"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          disabled={!value.trim() || disabled || isSubmitting}
          type="submit"
        >
          Send
        </button>
      </div>
    </form>
  );
}
