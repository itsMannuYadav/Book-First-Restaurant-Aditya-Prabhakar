"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { moduleForPath, MODULE_LABELS } from "@/constants/modules";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side hard block for dashboard modules the owner isn't entitled to.
 * Backed by `proxy.ts` (optimistic redirect), API-route checks, and Firestore
 * rules — this layer keeps the UI honest and sends owners to their home route.
 */
export function ModuleGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin, hasModule, homePath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const required = moduleForPath(pathname);
  const onDashboardRoot =
    pathname === ROUTES.dashboard || pathname === `${ROUTES.dashboard}/`;

  const blocked =
    !loading &&
    !isAdmin &&
    ((required !== null && !hasModule(required)) ||
      (onDashboardRoot && homePath !== ROUTES.dashboard));

  useEffect(() => {
    if (blocked && pathname !== homePath) {
      router.replace(homePath);
    }
  }, [blocked, homePath, pathname, router]);

  if (blocked) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-[#14110e]/10 bg-white p-8 text-center shadow-sm">
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
            {required ? `${MODULE_LABELS[required]} isn’t on your plan` : "Redirecting…"}
          </h1>
          <p className="mt-3 text-sm text-[#7a7164]">
            {required
              ? "Your account doesn’t include this module. Contact the Dine First team if you need access."
              : "Taking you to your workspace."}
          </p>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
