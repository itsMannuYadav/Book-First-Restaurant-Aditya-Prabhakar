"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { isAdminEmail } from "@/lib/admin/emails";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { loginSchema } from "@/lib/validators/forms";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const { signIn, signInGoogle, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    try {
      await signIn(parsed.data);
      router.replace(
        isAdminEmail(parsed.data.email) ? ROUTES.admin : ROUTES.dashboard,
      );
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGooglePending(true);
    try {
      await signInGoogle();
      const { auth: firebaseAuth } = await import("@/lib/firebase/client");
      const signedInEmail = firebaseAuth?.currentUser?.email;
      router.replace(
        isAdminEmail(signedInEmail) ? ROUTES.admin : ROUTES.dashboard,
      );
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGooglePending(false);
    }
  }

  return (
    <div>
      <Link
        href={ROUTES.home}
        className="mb-6 block font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e] lg:hidden"
      >
        {BRAND.name}
      </Link>
      <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold tracking-tight text-[#14110e]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-[#7a7164]">
        Sign in to manage your digital menu
      </p>

      {!configured ? (
        <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Firebase is not configured. Add keys to `.env` and restart the
          server.
        </p>
      ) : null}

      <div className="mt-7 space-y-4">
        <GoogleAuthButton
          pending={googlePending}
          disabled={!configured || pending}
          onClick={() => void onGoogle()}
        />

        <div className="flex items-center gap-3 text-xs text-[#7a7164]">
          <div className="h-px flex-1 bg-[#14110e]/10" />
          <span>or email</span>
          <div className="h-px flex-1 bg-[#14110e]/10" />
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-10 bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-10 bg-white"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || googlePending || !configured}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
            )}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-[#7a7164]">
        No account?{" "}
        <Link
          href={ROUTES.signup}
          className="font-medium text-[#14110e] underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
