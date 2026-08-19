"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Layers3,
  UtensilsCrossed,
  Palette,
  QrCode,
  Settings,
  Lock,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: ROUTES.ownerDemo, label: "Dashboard", icon: LayoutDashboard, locked: false },
  { href: ROUTES.signup, label: "Orders", icon: ClipboardList, locked: true },
  { href: ROUTES.signup, label: "Restaurant", icon: Store, locked: true },
  { href: ROUTES.signup, label: "Categories", icon: Layers3, locked: true },
  { href: ROUTES.signup, label: "Menu Items", icon: UtensilsCrossed, locked: true },
  { href: ROUTES.signup, label: "Themes", icon: Palette, locked: true },
  { href: ROUTES.signup, label: "QR Code", icon: QrCode, locked: true },
  { href: ROUTES.signup, label: "Settings", icon: Settings, locked: true },
] as const;

function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Sample dashboard">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = !item.locked;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-[#14110e] text-[#f4efe6] shadow-sm"
                : "text-[#5c554a] hover:bg-[#14110e]/5 hover:text-[#14110e]",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform group-hover:scale-105",
                active ? "text-[#e6c875]" : "text-[#8a8173]",
              )}
            />
            <span className="flex-1">{item.label}</span>
            {item.locked ? (
              <Lock className="size-3.5 shrink-0 text-[#8a8173]/70" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function OwnerDemoShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f3efe7]">
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-[#14110e]/8 bg-[#faf7f1] px-4 py-6 lg:flex">
        <Link
          href={ROUTES.home}
          className="mb-8 px-2 font-[family-name:var(--font-serif-display)] text-xl font-bold tracking-tight text-[#14110e]"
        >
          {BRAND.name}
        </Link>

        <div className="flex-1">
          <NavLinks />
        </div>

        <div className="mt-auto space-y-3 border-t border-[#14110e]/8 pt-4">
          <p className="flex items-center gap-1.5 px-2 text-xs text-[#7a7164]">
            <Sparkles className="size-3.5 text-[#c9a13b]" aria-hidden />
            Sample workspace &middot; demo data
          </p>
          <Link
            href={ROUTES.signup}
            className={cn(
              buttonVariants(),
              "w-full justify-center gap-2 bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
            )}
          >
            Sign up free
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#14110e]/8 bg-[#faf7f1]/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link
            href={ROUTES.home}
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
            <Link
              href={ROUTES.signup}
              className={cn(
                buttonVariants(),
                "mt-4 w-full justify-center gap-2 bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
              )}
            >
              Sign up free
            </Link>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl bf-fade-up">
            <div
              role="status"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/30 bg-[#e6c875]/15 px-4 py-3 text-sm text-[#5c4a1a] sm:px-5"
            >
              <p className="flex items-center gap-2 font-medium">
                <Sparkles className="size-4 text-[#c9a13b]" aria-hidden />
                You&apos;re viewing a sample owner dashboard with demo data.
              </p>
              <Link
                href={ROUTES.signup}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                )}
              >
                Create your own
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
