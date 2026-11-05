"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { API_BASE_URL, extractErrorMessage, storeAuthSession } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, Plane } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(await extractErrorMessage(res, "Incorrect email or password."));
        return;
      }

      const data = await res.json();
      storeAuthSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch {
      setError(
        "Cannot reach the Wayfarer API. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign-in failed. Please try again or use your email.");
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-[32px] p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Top ambient glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#C84B22]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Logo mark */}
      <div className="flex justify-center mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 dark:bg-white/10 border border-border/40 shadow-sm">
          <Plane className="h-5 w-5 text-[#C84B22] rotate-[-30deg]" />
        </div>
      </div>

      <div className="text-center space-y-1.5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sign in to your autonomous AI travel command center
        </p>
      </div>

      {/* Google OAuth CTA */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        type="button"
        className="w-full h-12 rounded-full glass border border-border/60 hover:bg-accent/40 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-xs mb-6 group shadow-xs"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span className="text-foreground">Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-border/50 w-full" />
        <span className="bg-background px-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider relative z-10 shrink-0">
          Or continue with email
        </span>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 text-center">
          {error}
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Link href="#" className="text-[11px] text-[#C84B22] font-semibold hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-accent/20 border-border/50 rounded-xl text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-coral w-full py-3.5 rounded-full text-xs font-bold shadow-lg flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="text-center mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-[#C84B22] font-bold hover:underline">
          Sign up free
        </Link>
      </div>
    </div>
  );
}

