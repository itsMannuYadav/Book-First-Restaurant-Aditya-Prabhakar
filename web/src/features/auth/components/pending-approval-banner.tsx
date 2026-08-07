"use client";

import { Clock3 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";

export function isOwnerAwaitingApproval(input: {
  accountStatus?: string | null;
  approvalStatus?: string | null;
}): boolean {
  return (
    input.accountStatus === "pending" ||
    input.approvalStatus === "pending" ||
    input.approvalStatus === "rejected"
  );
}

/**
 * Persistent notice for owners who cannot publish yet.
 */
export function PendingApprovalBanner({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { profile } = useAuth();
  const { restaurant } = useOwnerRestaurant();

  const awaiting = isOwnerAwaitingApproval({
    accountStatus: profile?.accountStatus,
    approvalStatus: restaurant?.approvalStatus,
  });

  if (!awaiting) return null;

  const rejected = restaurant?.approvalStatus === "rejected";

  if (compact) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-amber-500/35 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        <p className="font-semibold">
          {rejected ? "Application not approved yet" : "Waiting for team approval"}
        </p>
        <p className="mt-1 text-amber-950/85">
          {rejected
            ? "Please contact the Book First team. Publishing stays locked until you’re approved."
            : "You can build your menu as a draft. Publishing (and live QR guest ordering) unlocks after our team approves your account."}
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-4 text-amber-950 shadow-sm sm:px-5"
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
        <Clock3 className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-wide uppercase">
          {rejected ? "Not approved yet" : "Approval required"}
        </p>
        <p className="mt-1 font-[family-name:var(--font-serif-display)] text-xl font-bold leading-snug">
          {rejected
            ? "Your restaurant isn’t approved to go live yet."
            : "Please wait — our team needs to approve your account before you can publish."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
          Keep editing your restaurant details, categories, and menu items.
          Visibility stays on <strong>Draft</strong> until you’re approved.
          After approval you can publish and share your QR with guests.
        </p>
      </div>
    </div>
  );
}
