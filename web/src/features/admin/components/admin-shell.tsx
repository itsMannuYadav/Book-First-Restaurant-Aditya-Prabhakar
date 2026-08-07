"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BadgeCheck,
  Store,
  Users,
  LogOut,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { BRAND } from "@/constants/brand";
import { ADMIN_NAV, ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  AdminTour,
  restartAdminTour,
} from "@/features/admin/components/admin-tour";
import type { AdminTourStep } from "@/features/admin/lib/admin-tour";
import { cn } from "@/lib/utils";

const ICONS = {
  [ROUTES.admin]: LayoutDashboard,
  [ROUTES.adminApprovals]: BadgeCheck,
  [ROUTES.adminRestaurants]: Store,
  [ROUTES.adminOwners]: Users,
} as const;

const HIGHLIGHT_HREF: Record<
  NonNullable<AdminTourStep["highlight"]>,
  string
> = {
  overview: ROUTES.admin,
  approvals: ROUTES.adminApprovals,
  restaurants: ROUTES.adminRestaurants,
  owners: ROUTES.adminOwners,
};

function NavLinks({
  onNavigate,
  highlight,
}: {
  onNavigate?: () => void;
  highlight?: AdminTourStep["highlight"] | null;
}) {
  const pathname = usePathname();
  const highlightHref = highlight ? HIGHLIGHT_HREF[highlight] : null;

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === ROUTES.admin
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.href];
        const tourFocus = highlightHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            data-tour={item.href === ROUTES.admin ? "overview" : item.label.toLowerCase()}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-[#14110e] text-[#f4efe6] shadow-sm"
                : "text-[#5c554a] hover:bg-[#14110e]/5 hover:text-[#14110e]",
              tourFocus &&
                "ring-2 ring-[#e6c875] ring-offset-2 ring-offset-[#faf7f1]",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-[#e6c875]" : "text-[#8a8173]",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [forceTour, setForceTour] = useState(false);
  const [tourHighlight, setTourHighlight] = useState<
    AdminTourStep["highlight"] | null
  >(null);

  const handleForceOpenHandled = useCallback(() => {
    setForceTour(false);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace(ROUTES.login);
  }

  function startTour() {
    if (user?.uid) restartAdminTour(user.uid);
    setForceTour(true);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#f3efe7]">
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-[#14110e]/8 bg-[#faf7f1] px-4 py-6 lg:flex">
        <Link
          href={ROUTES.admin}
          className="mb-2 px-2 font-[family-name:var(--font-serif-display)] text-xl font-bold tracking-tight text-[#14110e]"
        >
          {BRAND.name}
        </Link>
        <p className="mb-8 px-2 text-xs font-medium tracking-wide text-[#8a8173] uppercase">
          Team console
        </p>

        <div className="flex-1">
          <NavLinks highlight={tourHighlight} />
        </div>

        <div className="mt-auto space-y-3 border-t border-[#14110e]/8 pt-4">
          <p className="truncate px-2 text-xs text-[#7a7164]">{user?.email}</p>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start gap-2 text-[#5c554a]",
            )}
            onClick={startTour}
          >
            <Compass className="size-4" />
            Take a tour
          </button>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-start gap-2 border-[#14110e]/10",
            )}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#14110e]/8 bg-[#faf7f1]/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link
            href={ROUTES.admin}
            className="font-[family-name:var(--font-serif-display)] text-lg font-bold"
          >
            {BRAND.name} Admin
          </Link>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {mobileOpen ? (
          <div className="border-b border-[#14110e]/8 bg-[#faf7f1] px-4 py-4 lg:hidden">
            <NavLinks
              highlight={tourHighlight}
              onNavigate={() => setMobileOpen(false)}
            />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "mt-4 w-full justify-start gap-2",
              )}
              onClick={startTour}
            >
              <Compass className="size-4" />
              Take a tour
            </button>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 w-full justify-start gap-2",
              )}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <AdminTour
        forceOpen={forceTour}
        onForceOpenHandled={handleForceOpenHandled}
        onHighlightChange={setTourHighlight}
      />
    </div>
  );
}
