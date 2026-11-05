"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BackendUser,
  clearAuthSession,
  getStoredToken,
  storeAuthSession,
} from "@/lib/api";

/**
 * Keeps browser storage in sync with the backend access token that was minted
 * server-side during Google sign-in.
 *
 * Without this, a Google session would have no backend identity and API calls
 * would be unauthenticated.
 */
export function BackendSessionBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Credential logins manage their own token; only clear when the stored
      // token came from a Google session that has now ended.
      return;
    }

    const backendToken = session?.backendToken;

    if (backendToken) {
      if (getStoredToken() !== backendToken) {
        storeAuthSession(backendToken, session?.backendUser as BackendUser);
      }
      return;
    }

    if (session?.backendAuthError) {
      // The OAuth session is not backed by a real backend identity.
      // Drop any stale token so requests fail visibly instead of silently.
      clearAuthSession();
      console.error(
        "[auth] Google sign-in could not be linked to a Wayfarer account:",
        session.backendAuthError
      );
    }
  }, [status, session]);

  return null;
}
