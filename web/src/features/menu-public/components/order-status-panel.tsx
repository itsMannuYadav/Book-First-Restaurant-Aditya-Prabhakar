"use client";

import { useEffect, useState } from "react";
import { GUEST_ORDER_POLL_MS } from "@/constants/orders";
import { formatPrice } from "@/features/menu-public/lib/filter-menu";
import {
  clearOrderTicket,
  isOpenGuestOrder,
  loadOrderTicket,
} from "@/lib/orders/guest-ticket";
import type { GuestOrderView, OrderStatus } from "@/types";

interface OrderStatusPanelProps {
  restaurantId: string;
  orderId: string;
  accessToken: string;
  onDismiss: () => void;
  onCleared?: () => void;
}

function statusCopy(status: OrderStatus): { title: string; body: string } {
  switch (status) {
    case "pending":
      return {
        title: "Waiting for the restaurant",
        body: "Your ticket was sent. Staff will confirm it shortly.",
      };
    case "confirmed":
      return {
        title: "Order confirmed",
        body: "The kitchen has your order. Hang tight.",
      };
    case "ready":
      return {
        title: "Ready",
        body: "Your order is ready — staff will bring it to your table.",
      };
    case "completed":
      return {
        title: "Completed",
        body: "Thanks for dining with us.",
      };
    case "declined":
      return {
        title: "Order declined",
        body: "The restaurant couldn’t take this order.",
      };
    case "cancelled":
      return {
        title: "Cancelled",
        body: "This order was cancelled.",
      };
    default:
      return { title: status, body: "" };
  }
}

export function OrderStatusPanel({
  restaurantId,
  orderId,
  accessToken,
  onDismiss,
  onCleared,
}: OrderStatusPanelProps) {
  const [order, setOrder] = useState<GuestOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchOnce() {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(accessToken)}`,
        );
        const data = (await res.json()) as {
          order?: GuestOrderView;
          message?: string;
        };
        if (!res.ok || !data.order) {
          if (!cancelled) {
            setError(data.message ?? "Unable to load order status.");
            setLoading(false);
          }
          return null;
        }
        if (!cancelled) {
          setOrder(data.order);
          setError(null);
          setLoading(false);
        }
        return data.order;
      } catch {
        if (!cancelled) {
          setError("Network error. We’ll keep trying…");
          setLoading(false);
        }
        return null;
      }
    }

    async function loop() {
      const latest = await fetchOnce();
      if (cancelled) return;
      const shouldPoll =
        !latest || latest.status === "pending" || latest.status === "confirmed";
      if (shouldPoll) {
        timer = setTimeout(() => {
          void loop();
        }, GUEST_ORDER_POLL_MS);
      }
    }

    void loop();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, accessToken]);

  const copy = order ? statusCopy(order.status) : null;

  function handleClear() {
    clearOrderTicket(restaurantId);
    onCleared?.();
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close order status"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-status-title"
        className="relative z-[91] flex max-h-[min(85vh,680px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] border border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--menu-border-muted)] px-[22px] py-[18px]">
          <h3
            id="order-status-title"
            className="menu-heading text-lg font-bold"
          >
            Your order
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-2 py-1 text-lg leading-none text-[var(--menu-muted)] transition-colors hover:text-[var(--menu-text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-5">
          {loading && !order ? (
            <p className="text-center text-[var(--menu-muted)]">Loading…</p>
          ) : error && !order ? (
            <p className="text-center text-[var(--menu-muted)]">{error}</p>
          ) : order && copy ? (
            <>
              <div className="text-center">
                <p className="text-xs font-medium tracking-wide text-[var(--menu-muted)] uppercase">
                  Order code
                </p>
                <p className="menu-heading mt-1 text-4xl font-bold tracking-wider">
                  {order.shortCode}
                </p>
                <p className="mt-2 text-sm text-[var(--menu-muted)]">
                  {order.tableLabel}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--menu-border-muted)] bg-[var(--menu-pill)] px-4 py-4 text-center">
                <p className="text-base font-semibold text-[var(--menu-text)]">
                  {copy.title}
                </p>
                <p className="mt-1 text-sm text-[var(--menu-muted)]">
                  {copy.body}
                </p>
                {order.status === "declined" && order.ownerNote ? (
                  <p className="mt-2 text-sm text-[var(--menu-accent)]">
                    {order.ownerNote}
                  </p>
                ) : null}
              </div>

              <ul className="mt-5 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 border-b border-dashed border-[var(--menu-border-muted)] py-2 text-sm"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {formatPrice(order.currency, item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-base font-bold text-[var(--menu-accent)]">
                Total: {formatPrice(order.currency, order.total)}
              </p>
              {error ? (
                <p className="mt-3 text-center text-xs text-[var(--menu-muted)]">
                  {error}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-[var(--menu-border-muted)] px-[22px] py-4">
          {!isOpenGuestOrder(order) && order ? (
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-full border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3.5 py-2.5 text-sm font-semibold"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-full bg-[image:var(--menu-pill-active)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-pill-active-text)]"
            >
              Keep browsing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Restore an open ticket from localStorage if present. */
export function readStoredTicket(restaurantId: string | undefined): {
  orderId: string;
  accessToken: string;
} | null {
  if (!restaurantId) return null;
  const stored = loadOrderTicket(restaurantId);
  if (!stored) return null;
  return {
    orderId: stored.orderId,
    accessToken: stored.accessToken,
  };
}
