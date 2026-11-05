"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { BackendSessionBridge } from "@/components/backend-session-bridge";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleExtensionError = (event: ErrorEvent) => {
      if (
        event.filename &&
        (event.filename.includes("chrome-extension://") ||
         event.filename.includes("moz-extension://"))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        event.reason.stack &&
        event.reason.stack.includes("chrome-extension://")
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleExtensionError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", handleExtensionError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
  }, []);

  return (
    <SessionProvider>
      <BackendSessionBridge />
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}
