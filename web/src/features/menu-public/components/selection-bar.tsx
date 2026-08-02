"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ORDER_GEO_RADIUS_METERS,
  MAX_GUEST_NOTE_LENGTH,
} from "@/constants/orders";
import { formatPrice } from "@/features/menu-public/lib/filter-menu";
import type { SelectionLine } from "@/features/menu-public/hooks/use-public-menu";
import { OrderStatusPanel, readStoredTicket } from "@/features/menu-public/components/order-status-panel";
import { haversineDistanceMeters } from "@/lib/geo/distance";
import { requestOrderGpsFix } from "@/lib/geo/request-gps";
import {
  loadOrderTicket,
  newIdempotencyKey,
  saveOrderTicket,
} from "@/lib/orders/guest-ticket";
import type { PublicMenuTable, RestaurantPublicProfile } from "@/types";

type Step = "selection" | "checkout" | "submitting";

interface SelectionBarProps {
  restaurant: RestaurantPublicProfile;
  count: number;
  total: number;
  currency: string;
  lines: SelectionLine[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
}

export function SelectionBar({
  restaurant,
  count,
  total,
  currency,
  lines,
  isOpen,
  onOpenChange,
  onClear,
  onIncrement,
  onDecrement,
}: SelectionBarProps) {
  const barVisible = count > 0 && !isOpen;
  const [checkoutStep, setCheckoutStep] = useState<Step>("selection");
  const step: Step = isOpen ? checkoutStep : "selection";
  const [tableId, setTableId] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [ticket, setTicket] = useState<{
    orderId: string;
    accessToken: string;
  } | null>(() => readStoredTicket(restaurant.id));

  const requireGuestGps = restaurant.requireGuestGps !== false;

  const orderingReady = useMemo(() => {
    return Boolean(
      restaurant.id &&
        restaurant.status === "published" &&
        restaurant.orderingEnabled &&
        (restaurant.tables?.length ?? 0) > 0 &&
        (!requireGuestGps || restaurant.location),
    );
  }, [restaurant, requireGuestGps]);

  const tables: PublicMenuTable[] = restaurant.tables ?? [];

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  async function submitOrder() {
    setFormError(null);

    if (!restaurant.id || !orderingReady) {
      setFormError("Ordering isn’t set up yet. Please ask staff for help.");
      return;
    }
    if (requireGuestGps && !restaurant.location) {
      setFormError("Ordering isn’t set up yet. Please ask staff for help.");
      return;
    }
    if (!tableId) {
      setFormError("Please choose your table or seat.");
      return;
    }
    if (lines.length === 0) {
      setFormError("Add at least one item before ordering.");
      return;
    }

    // Soft guard: if this device already has an open ticket, show it instead.
    if (restaurant.id) {
      const existing = loadOrderTicket(restaurant.id);
      if (existing) {
        try {
          const check = await fetch(
            `/api/orders/${encodeURIComponent(existing.orderId)}?token=${encodeURIComponent(existing.accessToken)}`,
          );
          if (check.ok) {
            const payload = (await check.json()) as {
              order?: { status?: string };
            };
            const status = payload.order?.status;
            if (
              status === "pending" ||
              status === "confirmed" ||
              status === "ready"
            ) {
              setTicket({
                orderId: existing.orderId,
                accessToken: existing.accessToken,
              });
              setStatusOpen(true);
              onOpenChange(false);
              setCheckoutStep("selection");
              return;
            }
          }
        } catch {
          // Fall through and attempt a new order.
        }
      }
    }

    setCheckoutStep("submitting");

    let lat: number | undefined;
    let lng: number | undefined;
    let accuracyMeters: number | undefined;

    if (requireGuestGps) {
      const gps = await requestOrderGpsFix();
      if (!gps.ok) {
        setFormError(gps.message);
        setCheckoutStep("checkout");
        return;
      }

      if (!restaurant.location) {
        setFormError("Ordering isn’t set up yet. Please ask staff for help.");
        setCheckoutStep("checkout");
        return;
      }

      const distance = haversineDistanceMeters(
        { lat: gps.lat, lng: gps.lng },
        restaurant.location,
      );
      const radius =
        restaurant.orderGeoRadiusMeters ?? DEFAULT_ORDER_GEO_RADIUS_METERS;
      if (distance > radius) {
        setFormError(
          `You need to be at the restaurant to order (about ${Math.round(distance)}m away).`,
        );
        setCheckoutStep("checkout");
        return;
      }

      lat = gps.lat;
      lng = gps.lng;
      accuracyMeters = gps.accuracyMeters;
    }

    const idempotencyKey = newIdempotencyKey();

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId,
          items: lines.map((line) => ({
            id: line.item.id,
            quantity: line.quantity,
          })),
          guestNote: guestNote.trim() || undefined,
          ...(typeof lat === "number" &&
          typeof lng === "number" &&
          typeof accuracyMeters === "number"
            ? { lat, lng, accuracyMeters }
            : {}),
          idempotencyKey,
          website: honeypot || undefined,
        }),
      });

      const data = (await res.json()) as {
        orderId?: string;
        accessToken?: string;
        shortCode?: string;
        message?: string;
        code?: string;
        meta?: { orderId?: string; distanceMeters?: number };
      };

      if (res.status === 409 && data.code === "IDEMPOTENCY_REPLAY") {
        setFormError(
          "This order was already submitted. Open your order ticket if it’s still on this phone.",
        );
        setCheckoutStep("checkout");
        if (ticket) setStatusOpen(true);
        return;
      }

      if (!res.ok || !data.orderId || !data.accessToken) {
        setFormError(data.message ?? "Couldn’t place your order. Try again.");
        setCheckoutStep("checkout");
        return;
      }

      saveOrderTicket(restaurant.id, {
        orderId: data.orderId,
        accessToken: data.accessToken,
        shortCode: data.shortCode ?? "",
      });
      setTicket({
        orderId: data.orderId,
        accessToken: data.accessToken,
      });
      onClear();
      onOpenChange(false);
      setStatusOpen(true);
      setCheckoutStep("selection");
      setTableId("");
      setGuestNote("");
      setHoneypot("");
    } catch {
      setFormError("Network error. Check your connection and try again.");
      setCheckoutStep("checkout");
    }
  }

  return (
    <>
      {ticket && restaurant.id && !statusOpen ? (
        <button
          type="button"
          onClick={() => setStatusOpen(true)}
          className="fixed bottom-[5.5rem] left-1/2 z-40 -translate-x-1/2 rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)] px-4 py-2 text-xs font-semibold text-[var(--menu-text)] shadow-md"
        >
          View your order
        </button>
      ) : null}

      <div
        className={`fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-40px)] max-w-[600px] items-center justify-between rounded-full bg-[image:var(--menu-pill-active)] px-[22px] py-3.5 text-[var(--menu-pill-active-text)] shadow-[0_12px_35px_rgba(0,0,0,0.45)] transition-transform duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
          barVisible
            ? "-translate-x-1/2 translate-y-0"
            : "pointer-events-none -translate-x-1/2 translate-y-[140%]"
        }`}
        aria-live="polite"
        aria-hidden={!barVisible}
      >
        <div className="flex flex-col">
          <span className="text-[0.82rem] font-medium opacity-90">
            {count} item{count === 1 ? "" : "s"} selected
          </span>
          <span className="text-[1.15rem] font-bold">
            Total: {formatPrice(currency, total)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="rounded-full bg-[var(--menu-surface)] px-[18px] py-2 text-[0.85rem] font-bold text-[var(--menu-text)] shadow-md"
        >
          View Selection
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close selection dialog"
            onClick={() => onOpenChange(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="selection-dialog-title"
            className="relative z-[81] flex max-h-[min(80vh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] border border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--menu-border-muted)] px-[22px] py-[18px]">
              <h3
                id="selection-dialog-title"
                className="menu-heading text-lg font-bold"
              >
                {step === "checkout" || step === "submitting"
                  ? "Place dine-in order"
                  : "Your Selected Items"}
              </h3>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-2 py-1 text-lg leading-none text-[var(--menu-muted)] transition-colors hover:text-[var(--menu-text)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-5">
              {step === "selection" ? (
                lines.length === 0 ? (
                  <p className="text-center text-[var(--menu-muted)]">
                    No items selected.
                  </p>
                ) : (
                  <>
                    {lines.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 border-b border-dashed border-[var(--menu-border-muted)] py-2.5"
                      >
                        <div className="min-w-0">
                          <strong className="text-[var(--menu-text)]">
                            {item.name}
                          </strong>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name}`}
                              onClick={() => onDecrement(item.id)}
                              className="flex size-7 items-center justify-center rounded-full border border-[var(--menu-border)] text-sm"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name}`}
                              onClick={() => onIncrement(item.id)}
                              className="flex size-7 items-center justify-center rounded-full border border-[var(--menu-border)] text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="shrink-0 font-medium text-[var(--menu-text)]">
                          {formatPrice(currency, item.price * quantity)}
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 text-right text-[1.1rem] font-bold text-[var(--menu-accent)]">
                      Total: {formatPrice(currency, total)}
                    </div>
                  </>
                )
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--menu-muted)]">
                    {requireGuestGps
                      ? "Dine-in only. We’ll use your location to confirm you’re at the restaurant — no account needed."
                      : "Dine-in ticket — pick your table and send it to the kitchen. No account needed."}
                  </p>

                  <div className="space-y-2">
                    <label
                      htmlFor="table-select"
                      className="text-sm font-semibold"
                    >
                      Your table / seat
                    </label>
                    <select
                      id="table-select"
                      value={tableId}
                      disabled={step === "submitting"}
                      onChange={(e) => setTableId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3 text-sm text-[var(--menu-text)]"
                    >
                      <option value="">Select…</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="guest-note"
                      className="text-sm font-semibold"
                    >
                      Note (optional)
                    </label>
                    <textarea
                      id="guest-note"
                      value={guestNote}
                      maxLength={MAX_GUEST_NOTE_LENGTH}
                      disabled={step === "submitting"}
                      onChange={(e) => setGuestNote(e.target.value)}
                      placeholder="Less spicy, no onion…"
                      className="min-h-20 w-full rounded-xl border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3 py-2 text-sm text-[var(--menu-text)]"
                    />
                  </div>

                  {/* Honeypot for bots — visually hidden */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
                  >
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {formError ? (
                    <p className="rounded-xl border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3 py-2 text-sm text-[var(--menu-accent)]">
                      {formError}
                    </p>
                  ) : null}

                  {step === "submitting" ? (
                    <p className="text-center text-sm text-[var(--menu-muted)]">
                      {requireGuestGps
                        ? "Checking your location and sending the order…"
                        : "Sending your order…"}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-[var(--menu-border-muted)] bg-[var(--menu-surface)] px-[22px] py-4">
              {step === "selection" ? (
                <>
                  <button
                    type="button"
                    onClick={onClear}
                    className="flex-1 rounded-full border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-text)] transition-colors hover:border-[var(--menu-accent)]"
                  >
                    Clear Selection
                  </button>
                  {orderingReady ? (
                    <button
                      type="button"
                      disabled={lines.length === 0}
                      onClick={() => {
                        setFormError(null);
                        setCheckoutStep("checkout");
                      }}
                      className="flex-[2] rounded-full bg-[image:var(--menu-pill-active)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-pill-active-text)] shadow-md disabled:opacity-50"
                    >
                      Place order
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Ordering isn’t set up yet"
                      className="flex-[2] rounded-full bg-[image:var(--menu-pill-active)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-pill-active-text)] opacity-50 shadow-md"
                    >
                      Ordering unavailable
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={step === "submitting"}
                    onClick={() => setCheckoutStep("selection")}
                    className="flex-1 rounded-full border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3.5 py-2.5 text-sm font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={step === "submitting"}
                    onClick={() => void submitOrder()}
                    className="flex-[2] rounded-full bg-[image:var(--menu-pill-active)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-pill-active-text)] shadow-md disabled:opacity-60"
                  >
                    {step === "submitting" ? "Sending…" : "Confirm order"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {statusOpen && ticket && restaurant.id ? (
        <OrderStatusPanel
          restaurantId={restaurant.id}
          orderId={ticket.orderId}
          accessToken={ticket.accessToken}
          onDismiss={() => setStatusOpen(false)}
          onCleared={() => setTicket(null)}
        />
      ) : null}
    </>
  );
}
