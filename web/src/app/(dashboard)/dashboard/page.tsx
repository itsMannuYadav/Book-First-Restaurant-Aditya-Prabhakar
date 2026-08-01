"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Layers3,
  QrCode,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Orders",
    body: "Confirm, decline, and complete dine-in tickets.",
    href: ROUTES.orders,
    icon: ClipboardList,
  },
  {
    title: "Restaurant",
    body: "Name, hours, address, pin, and tables.",
    href: ROUTES.restaurant,
    icon: Store,
  },
  {
    title: "Categories",
    body: "Sections guests scroll through.",
    href: ROUTES.categories,
    icon: Layers3,
  },
  {
    title: "Menu Items",
    body: "Dishes, prices, tags, and badges.",
    href: ROUTES.menuItems,
    icon: UtensilsCrossed,
  },
  {
    title: "QR Code",
    body: "Share the link guests scan.",
    href: ROUTES.qr,
    icon: QrCode,
  },
] as const;

export default function DashboardHomePage() {
  const { restaurant, loading } = useOwnerRestaurant();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-80" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  const statusLabel =
    restaurant?.status === "published"
      ? "Live"
      : restaurant?.status === "draft"
        ? "Draft"
        : restaurant?.status ?? "Setup";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-[#8a8173] uppercase">
            Workspace
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-4xl font-bold tracking-tight text-[#14110e]">
            {restaurant?.name ?? "Dashboard"}
          </h1>
          <p className="mt-2 text-[#7a7164]">
            Keep your digital menu polished and ready to share.
          </p>
        </div>
        <div className="rounded-full border border-[#14110e]/10 bg-white px-3 py-1.5 text-sm text-[#5c554a]">
          Status ·{" "}
          <span className="font-semibold text-[#14110e]">{statusLabel}</span>
        </div>
      </div>

      {restaurant ? (
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#14110e]/8 bg-[#14110e] px-6 py-6 text-[#f4efe6] shadow-[0_20px_50px_rgba(20,17,14,0.12)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#c9b896]">Guest menu link</p>
              <p className="mt-1 font-[family-name:var(--font-serif-display)] text-2xl font-semibold">
                /m/{restaurant.slug}
              </p>
            </div>
            <Link
              href={ROUTES.publicMenu(restaurant.slug)}
              target="_blank"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
              )}
            >
              Open menu
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-3xl border border-[#14110e]/8 bg-white/70 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#14110e]/15 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#14110e]/5 text-[#14110e] transition-colors group-hover:bg-[#14110e] group-hover:text-[#e6c875]">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#14110e]">
                {action.title}
              </h2>
              <p className="mt-1 text-sm text-[#7a7164]">{action.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
