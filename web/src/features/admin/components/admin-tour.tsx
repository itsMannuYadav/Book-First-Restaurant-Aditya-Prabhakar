"use client";

import { useEffect, useId, useState } from "react";
import { Compass, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ADMIN_TOUR_STEPS,
  clearAdminTourCompleted,
  hasCompletedAdminTour,
  markAdminTourCompleted,
  type AdminTourStep,
} from "@/features/admin/lib/admin-tour";
import { cn } from "@/lib/utils";

type AdminTourProps = {
  /** When true, force-open (e.g. “Take a tour”). */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
  onHighlightChange?: (highlight: AdminTourStep["highlight"] | null) => void;
};

export function AdminTour({
  forceOpen = false,
  onForceOpenHandled,
  onHighlightChange,
}: AdminTourProps) {
  const { user } = useAuth();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const completed = hasCompletedAdminTour(user.uid);
    queueMicrotask(() => {
      setReady(true);
      if (!completed) setOpen(true);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!forceOpen) return;
    queueMicrotask(() => {
      setStepIndex(0);
      setOpen(true);
      onForceOpenHandled?.();
    });
  }, [forceOpen, onForceOpenHandled]);

  const step = ADMIN_TOUR_STEPS[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === ADMIN_TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!open) {
      onHighlightChange?.(null);
      return;
    }
    onHighlightChange?.(step.highlight ?? null);
  }, [open, step.highlight, onHighlightChange]);

  function finish() {
    if (user?.uid) markAdminTourCompleted(user.uid);
    setOpen(false);
    onHighlightChange?.(null);
  }

  function skip() {
    finish();
  }

  if (!ready || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#14110e]/45 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) skip();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bf-fade-up w-full max-w-md overflow-hidden rounded-3xl border border-[#14110e]/10 bg-[#faf7f1] shadow-[0_24px_80px_rgba(20,17,14,0.28)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#14110e]/8 px-5 py-4">
          <div className="flex items-center gap-2 text-[#8a8173]">
            <Compass className="size-4" aria-hidden />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Team tour · {stepIndex + 1} of {ADMIN_TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "shrink-0",
            )}
            onClick={skip}
            aria-label="Close tour"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-serif-display)] text-2xl font-bold tracking-tight text-[#14110e]"
          >
            {step.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c554a]">
            {step.body}
          </p>
          {step.tip ? (
            <p className="mt-4 rounded-2xl border border-[#14110e]/8 bg-white/80 px-3 py-2.5 text-xs leading-relaxed text-[#7a7164]">
              {step.tip}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {ADMIN_TOUR_STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex
                    ? "w-6 bg-[#14110e]"
                    : i < stepIndex
                      ? "w-1.5 bg-[#14110e]/40"
                      : "w-1.5 bg-[#14110e]/15",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#14110e]/8 px-5 py-4">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-[#7a7164]",
            )}
            onClick={skip}
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {!isFirst ? (
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
            ) : null}
            {isLast ? (
              <button
                type="button"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                )}
                onClick={finish}
              >
                Got it
              </button>
            ) : (
              <button
                type="button"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                )}
                onClick={() =>
                  setStepIndex((i) =>
                    Math.min(ADMIN_TOUR_STEPS.length - 1, i + 1),
                  )
                }
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function restartAdminTour(uid: string) {
  clearAdminTourCompleted(uid);
}
