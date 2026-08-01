"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import {
  subscribeOwnerOrders,
  updateOrderStatus,
} from "@/lib/firebase/orders";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { cn } from "@/lib/utils";
import type { OrderStatus, OwnerOrderView } from "@/types";

type FilterTab = "pending" | "active" | "done";

function formatMoney(currency: string, amount: number): string {
  return `${currency}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function matchesTab(order: OwnerOrderView, tab: FilterTab): boolean {
  if (tab === "pending") return order.status === "pending";
  if (tab === "active")
    return order.status === "confirmed" || order.status === "ready";
  return (
    order.status === "completed" ||
    order.status === "declined" ||
    order.status === "cancelled"
  );
}

export function OrdersBoard() {
  const { restaurant, loading: restaurantLoading } = useOwnerRestaurant();
  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  useEffect(() => {
    if (!restaurant?.id) return;

    const unsub = subscribeOwnerOrders(
      restaurant.id,
      (next) => {
        setOrders(next);
        setSubscriptionLoading(false);
        setError(null);
      },
      (message) => {
        setError(message);
        setSubscriptionLoading(false);
      },
    );
    return () => unsub();
  }, [restaurant?.id]);

  const filtered = useMemo(
    () => orders.filter((o) => matchesTab(o, tab)),
    [orders, tab],
  );

  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      active: orders.filter(
        (o) => o.status === "confirmed" || o.status === "ready",
      ).length,
      done: orders.filter(
        (o) =>
          o.status === "completed" ||
          o.status === "declined" ||
          o.status === "cancelled",
      ).length,
    }),
    [orders],
  );

  async function setStatus(
    order: OwnerOrderView,
    status: OrderStatus,
    note?: string,
  ) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order, status, note);
      toast.success(`Order ${order.shortCode} · ${statusLabel(status)}`);
      setDeclineFor(null);
      setDeclineNote("");
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (restaurantLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rounded-2xl border border-[#14110e]/10 px-4 py-3 text-sm text-[#5c554a]">
        Create your restaurant profile first, then orders will appear here.
      </div>
    );
  }

  if (subscriptionLoading && !error) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kitchen"
        title="Orders"
        description="Confirm or decline dine-in tickets. Guests see live status on their phone."
      />

      {!restaurant?.orderingEnabled ? (
        <div className="rounded-2xl border border-[#14110e]/10 bg-[#14110e]/[0.03] px-4 py-3 text-sm text-[#5c554a]">
          Dine-in ordering is off. Set your venue pin, add tables, and enable
          ordering under Restaurant.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <p className="mt-2 text-xs opacity-80">
            If this mentions an index, open the link in the browser console /
            Firebase error and create the composite index for orders
            (restaurantId + createdAt).
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending", counts.pending],
            ["active", "Active", counts.active],
            ["done", "Done", counts.done],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-[#14110e] text-[#f4efe6]"
                : "bg-white text-[#5c554a] hover:bg-[#14110e]/5",
            )}
          >
            {label}
            <span className="ml-2 tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#14110e]/15 px-6 py-12 text-center text-sm text-[#8a8173]">
          No {tab} orders yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((order) => {
            const busy = busyId === order.id;
            return (
              <li
                key={order.id}
                className="rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-serif-display)] text-2xl font-bold tracking-tight text-[#14110e]">
                      {order.shortCode}
                    </p>
                    <p className="mt-1 text-sm text-[#5c554a]">
                      {order.tableLabel} · {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-[#14110e]/5 px-2.5 py-1 text-xs font-semibold text-[#14110e]">
                      {statusLabel(order.status)}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-[#14110e]">
                      {formatMoney(order.currency, order.total)}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 border-t border-dashed border-[#14110e]/10 pt-3 text-sm text-[#5c554a]">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.id}`} className="flex justify-between gap-3">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="tabular-nums">
                        {formatMoney(order.currency, item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.guestNote ? (
                  <p className="mt-3 text-sm text-[#7a7164]">
                    Guest note: {order.guestNote}
                  </p>
                ) : null}

                {order.guestLocation ? (
                  <p className="mt-2 text-xs text-[#8a8173]">
                    Distance ~{order.guestLocation.distanceMeters}m · GPS ±
                    {Math.round(order.guestLocation.accuracyMeters)}m
                  </p>
                ) : null}

                {order.ownerNote && order.status === "declined" ? (
                  <p className="mt-2 text-sm text-destructive">
                    Decline reason: {order.ownerNote}
                  </p>
                ) : null}

                {order.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(order, "confirmed")}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                      )}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDeclineFor(order.id);
                        setDeclineNote("");
                      }}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                        "border-destructive/30 text-destructive",
                      )}
                    >
                      Decline
                    </button>
                  </div>
                ) : null}

                {declineFor === order.id ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Optional reason for the guest"
                      value={declineNote}
                      onChange={(e) => setDeclineNote(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void setStatus(order, "declined", declineNote)
                      }
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-destructive text-white hover:bg-destructive/90",
                      )}
                    >
                      Confirm decline
                    </button>
                  </div>
                ) : null}

                {order.status === "confirmed" ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(order, "ready")}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                      )}
                    >
                      Mark ready
                    </button>
                  </div>
                ) : null}

                {order.status === "ready" ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(order, "completed")}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                      )}
                    >
                      Complete
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
