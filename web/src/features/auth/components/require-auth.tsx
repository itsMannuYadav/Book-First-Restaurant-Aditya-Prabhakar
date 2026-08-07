"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace(ROUTES.admin);
    }
  }, [loading, user, isAdmin, router]);

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
  if (isAdmin) return null;

  if (profile?.accountStatus === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3efe7] p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#14110e]/10 bg-white p-8 text-center shadow-sm">
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
            Account suspended
          </h1>
          <p className="mt-3 text-sm text-[#7a7164]">
            {profile.suspendReason?.trim() ||
              "Your owner account has been temporarily suspended. Contact the Book First team for help."}
          </p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
            onClick={() =>
              void signOut().then(() => router.replace(ROUTES.login))
            }
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
