"use client";

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" color="green" />,
        info: <InfoIcon className="size-4" color="blue" />,
        warning: <TriangleAlertIcon className="size-4" color="yellow" />,
        error: <OctagonXIcon className="size-4" color="red" />,
        loading: <Loader2Icon className="size-4 animate-spin" color="gray" />,
      }}
      style={
        {
          zIndex: 99_999,
          "--normal-bg": "var(--toast-bg)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--toast-border)",
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
}
