import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

// Fail loudly instead of silently falling back to a shared, guessable secret.
if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXTAUTH_SECRET (or AUTH_SECRET) must be set. Refusing to start with an insecure default."
  );
}

const googleProviderConfigured = Boolean(googleClientId && googleClientSecret);

if (!googleProviderConfigured) {
  console.warn(
    "[auth] Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing). Google sign-in is disabled."
  );
}

// Keep the NextAuth session aligned with the backend access token lifetime
// so a live session can never outlive its backend credential.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type BackendExchange =
  | { ok: true; accessToken: string; user: unknown }
  | { ok: false; error: string };

/**
 * Trade a Google ID token for a Wayfarer backend access token.
 * Runs server-side only: the Google ID token is never exposed to the browser.
 */
async function exchangeGoogleIdToken(idToken: string): Promise<BackendExchange> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = `Backend rejected Google sign-in (HTTP ${res.status}).`;
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail;
      } catch {
        // keep default detail
      }
      return { ok: false, error: detail };
    }

    const data = await res.json();
    if (!data?.access_token) {
      return { ok: false, error: "Backend did not return an access token." };
    }
    return { ok: true, accessToken: data.access_token, user: data.user };
  } catch {
    return {
      ok: false,
      error: "Could not reach the Wayfarer API to complete Google sign-in.",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: googleProviderConfigured
    ? [
        Google({
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
        }),
      ]
    : [],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, account }) {
      // Only present on the initial sign-in request.
      if (account?.id_token) {
        const exchange = await exchangeGoogleIdToken(account.id_token as string);
        if (exchange.ok) {
          token.backendToken = exchange.accessToken;
          token.backendUser = exchange.user;
          delete token.backendAuthError;
        } else {
          delete token.backendToken;
          delete token.backendUser;
          token.backendAuthError = exchange.error;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      session.backendToken = token.backendToken as string | undefined;
      session.backendUser = token.backendUser;
      session.backendAuthError = token.backendAuthError as string | undefined;
      return session;
    },
  },
  secret: authSecret,
});
