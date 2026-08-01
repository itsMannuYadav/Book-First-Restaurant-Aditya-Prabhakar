"use client";

import { useEffect } from "react";
import { formatPrice } from "@/features/menu-public/lib/filter-menu";
import type { SelectionLine } from "@/features/menu-public/hooks/use-public-menu";

interface SelectionBarProps {
  count: number;
  total: number;
  currency: string;
  lines: SelectionLine[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
}

export function SelectionBar({
  count,
  total,
  currency,
  lines,
  isOpen,
  onOpenChange,
  onClear,
}: SelectionBarProps) {
  const barVisible = count > 0 && !isOpen;

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

  return (
    <>
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
                Your Selected Items
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
              {lines.length === 0 ? (
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
                        <span className="text-[var(--menu-muted)]">
                          {" "}
                          × {quantity}
                        </span>
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
              )}
            </div>

            <div className="flex gap-3 border-t border-[var(--menu-border-muted)] bg-[var(--menu-surface)] px-[22px] py-4">
              <button
                type="button"
                onClick={onClear}
                className="flex-1 rounded-full border border-[var(--menu-border)] bg-[var(--menu-pill)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-text)] transition-colors hover:border-[var(--menu-accent)]"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                }}
                className="flex-[2] rounded-full bg-[image:var(--menu-pill-active)] px-3.5 py-2.5 text-sm font-semibold text-[var(--menu-pill-active-text)] shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
