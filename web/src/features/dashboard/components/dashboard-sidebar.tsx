"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/constants/brand";
import { DASHBOARD_NAV, ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6">
      <Link
        href={ROUTES.dashboard}
        className="mb-8 px-2 font-[family-name:var(--font-serif-display)] text-xl font-bold tracking-tight"
      >
        {BRAND.name}
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
        {DASHBOARD_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border pt-4">
        <p className="truncate px-2 text-xs text-muted-foreground">
          {user?.email}
        </p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          onClick={async () => {
            await signOut();
            router.replace(ROUTES.login);
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
