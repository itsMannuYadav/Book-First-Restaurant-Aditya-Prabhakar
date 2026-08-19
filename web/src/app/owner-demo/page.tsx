"use client";

import { useMemo } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowUpRight,
  ClipboardList,
  Layers3,
  Lock,
  QrCode,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import demoMenu from "@/data/demo-menu.json";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { OwnerDemoShell } from "@/features/marketing/components/owner-demo-shell";
import { cn } from "@/lib/utils";
import type { DemoMenuJson } from "@/types";

const menu = demoMenu as DemoMenuJson;
const DEMO_SLUG = "cafe-aroma";

const categoryCount = menu.categories.length;
const itemCount = menu.categories.reduce(
  (sum, category) => sum + category.items.length,
  0,
);

const STATS = [
  { label: "Categories", value: String(categoryCount) },
  { label: "Menu items", value: String(itemCount) },
  { label: "Orders today", value: "12" },
  { label: "Avg. order value", value: "₹540" },
] as const;

const actions = [
  {
    title: "Orders",
    body: "Confirm, decline, and complete dine-in tickets.",
    icon: ClipboardList,
  },
  {
    title: "Restaurant",
    body: "Name, hours, address, pin, and tables.",
    icon: Store,
  },
  {
    title: "Categories",
    body: "Sections guests scroll through.",
    icon: Layers3,
  },
  {
    title: "Menu Items",
    body: "Dishes, prices, tags, and badges.",
    icon: UtensilsCrossed,
  },
  {
    title: "QR Code",
    body: "Share the link guests scan.",
    icon: QrCode,
  },
] as const;

type DemoOrderStatus = "pending" | "confirmed" | "ready" | "completed";

const DEMO_ORDERS: Array<{
  id: string;
  shortCode: string;
  tableLabel: string;
  status: DemoOrderStatus;
  total: number;
  items: string;
}> = [
  {
    id: "1",
    shortCode: "A-104",
    tableLabel: "Table 4",
    status: "pending",
    total: 620,
    items: "Cappuccino, Truffle Mushroom Crostini",
  },
  {
    id: "2",
    shortCode: "A-103",
    tableLabel: "Table 7",
    status: "confirmed",
    total: 1180,
    items: "Pan-Seared Salmon Fillet, Matcha Ceremonial Cloud",
  },
  {
    id: "3",
    shortCode: "A-102",
    tableLabel: "Table 2",
    status: "ready",
    total: 340,
    items: "Pistachio & Raspberry Tart",
  },
  {
    id: "4",
    shortCode: "A-101",
    tableLabel: "Table 1",
    status: "completed",
    total: 890,
    items: "Herb-Crusted Rack of Lamb, Gold Leaf Caramel Latte",
  },
];

function statusStyle(status: DemoOrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "confirmed":
      return "bg-blue-100 text-blue-900";
    case "ready":
      return "bg-emerald-100 text-emerald-900";
    case "completed":
      return "bg-[#14110e]/5 text-[#14110e]";
  }
}

function statusLabel(status: DemoOrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
  }
}

export default function OwnerDemoPage() {
  const menuUrl = useMemo(() => {
    if (typeof window === "undefined") return ROUTES.publicMenu(DEMO_SLUG);
    return `${window.location.origin}${ROUTES.publicMenu(DEMO_SLUG)}`;
  }, []);

  return (
    <OwnerDemoShell>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-[#8a8173] uppercase">
              Workspace
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-4xl font-bold tracking-tight text-[#14110e]">
              {menu.restaurant}
            </h1>
            <p className="mt-2 text-[#7a7164]">
              Keep your digital menu polished and ready to share.
            </p>
          </div>
          <div className="rounded-full border border-[#14110e]/10 bg-white px-3 py-1.5 text-sm text-[#5c554a]">
            Status · <span className="font-semibold text-[#14110e]">Live</span>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[#14110e]/8 bg-[#14110e] px-6 py-6 text-[#f4efe6] shadow-[0_20px_50px_rgba(20,17,14,0.12)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#c9b896]">Guest menu link</p>
              <p className="mt-1 font-[family-name:var(--font-serif-display)] text-2xl font-semibold">
                /m/{DEMO_SLUG}
              </p>
            </div>
            <Link
              href={ROUTES.publicMenu(DEMO_SLUG)}
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-[#14110e]/8 bg-white/70 p-5 shadow-sm"
            >
              <p className="text-xs font-medium tracking-wide text-[#8a8173] uppercase">
                {stat.label}
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={ROUTES.signup}
                className="group relative rounded-3xl border border-[#14110e]/8 bg-white/70 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#14110e]/15 hover:shadow-md"
              >
                <Lock className="absolute top-6 right-6 size-3.5 text-[#8a8173]/60" aria-hidden />
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

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
              Recent orders
            </h2>
            <p className="mt-1 text-sm text-[#7a7164]">
              Sample tickets — sign up to confirm, decline, and track real
              orders.
            </p>

            <ul className="mt-4 space-y-3">
              {DEMO_ORDERS.map((order) => (
                <li
                  key={order.id}
                  className="rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-[family-name:var(--font-serif-display)] text-xl font-bold tracking-tight text-[#14110e]">
                        {order.shortCode}
                      </p>
                      <p className="mt-1 text-sm text-[#5c554a]">
                        {order.tableLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          statusStyle(order.status),
                        )}
                      >
                        {statusLabel(order.status)}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-[#14110e]">
                        ₹{order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-dashed border-[#14110e]/10 pt-3 text-sm text-[#5c554a]">
                    {order.items}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-bold text-[#14110e]">
              QR Code
            </h2>
            <p className="mt-1 text-sm text-[#7a7164]">
              Scan it — this one really opens the sample menu.
            </p>
            <div className="mt-4 inline-flex rounded-[1.75rem] border border-[#14110e]/8 bg-white p-6 shadow-[0_20px_50px_rgba(20,17,14,0.08)]">
              <QRCodeCanvas value={menuUrl} size={180} level="M" includeMargin />
            </div>
            <p className="mt-3 max-w-xs text-xs break-all text-[#8a8173]">
              {menuUrl}
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-[#14110e]/8 bg-[#14110e] px-6 py-8 text-center text-[#f4efe6] sm:px-10">
          <p className="font-[family-name:var(--font-serif-display)] text-2xl font-bold">
            Ready to run your own restaurant like this?
          </p>
          <p className="mt-2 text-[#c9b896]">
            Create your workspace, publish your menu, and start taking dine-in
            orders in minutes.
          </p>
          <Link
            href={ROUTES.signup}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 gap-2 bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
            )}
          >
            Get started free
          </Link>
        </div>
      </div>
    </OwnerDemoShell>
  );
}
