"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Layers3,
  UtensilsCrossed,
  Palette,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.orders, label: "Orders", icon: ClipboardList },
  { href: ROUTES.restaurant, label: "Restaurant", icon: Store },
  { href: ROUTES.categories, label: "Categories", icon: Layers3 },
  { href: ROUTES.menuItems, label: "Menu Items", icon: UtensilsCrossed },
  { href: ROUTES.themes, label: "Themes", icon: Palette },
  { href: ROUTES.qr, label: "QR Code", icon: QrCode },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

function NavLinks({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-[#14110e] text-[#f4efe6] shadow-sm"
                : "text-[#5c554a] hover:bg-[#14110e]/5 hover:text-[#14110e]",
              compact && "justify-center px-2",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform group-hover:scale-105",
                active ? "text-[#e6c875]" : "text-[#8a8173]",
              )}
            />
            {!compact ? item.label : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace(ROUTES.login);
  }

  return (
    <div className="flex min-h-screen bg-[#f3efe7]">
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-[#14110e]/8 bg-[#faf7f1] px-4 py-6 lg:flex">
        <Link
          href={ROUTES.dashboard}
          className="mb-8 px-2 font-[family-name:var(--font-serif-display)] text-xl font-bold tracking-tight text-[#14110e]"
        >
          {BRAND.name}
        </Link>

        <div className="flex-1">
          <NavLinks />
        </div>

        <div className="mt-auto space-y-3 border-t border-[#14110e]/8 pt-4">
          <p className="truncate px-2 text-xs text-[#7a7164]">{user?.email}</p>
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
            href={ROUTES.dashboard}
            className="font-[family-name:var(--font-serif-display)] text-lg font-bold"
          >
            {BRAND.name}
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
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-4 w-full justify-start gap-2",
              )}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl bf-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
