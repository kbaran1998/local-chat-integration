"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ConfirmModalProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root onOpenChange={(nextOpen) => onOpenChange(nextOpen)} open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup
            className={cn(
              "w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg",
              "dark:border-zinc-800 dark:bg-zinc-900",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in"
            )}
          >
            <AlertDialog.Title className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                {cancelLabel}
              </Button>
              <Button
                onClick={handleConfirm}
                type="button"
                variant={variant === "destructive" ? "destructive" : "default"}
              >
                {confirmLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
