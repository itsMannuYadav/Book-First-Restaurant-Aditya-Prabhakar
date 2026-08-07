"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3efe7] p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#14110e]/10 bg-white p-8 text-center shadow-sm">
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
            Not authorized
          </h1>
          <p className="mt-3 text-sm text-[#7a7164]">
            This console is only for the Book First team. Your account is not on
            the admin allowlist.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => router.replace(ROUTES.dashboard)}
            >
              Owner dashboard
            </button>
            <button
              type="button"
              className={cn(buttonVariants())}
              onClick={() =>
                void signOut().then(() => router.replace(ROUTES.login))
              }
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
