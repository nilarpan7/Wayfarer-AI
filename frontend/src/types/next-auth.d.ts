import type { DefaultSession } from "next-auth";

/**
 * The Google ID token is exchanged for a Wayfarer backend access token inside
 * the NextAuth `jwt` callback (server-side), and only the backend token is
 * exposed to the client.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id?: string;
    } & DefaultSession["user"];
    backendToken?: string;
    backendUser?: unknown;
    backendAuthError?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    backendUser?: unknown;
    backendAuthError?: string;
  }
}
