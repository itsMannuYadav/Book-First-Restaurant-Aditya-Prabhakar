"use client";

import { useState } from "react";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  PRESET_LABELS,
  detectPreset,
} from "@/constants/modules";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PresetPicker } from "@/features/admin/components/preset-picker";
import { cn } from "@/lib/utils";
import type { AccountStatus, OwnerModules } from "@/types";

function capabilitySummary(modules: OwnerModules): string {
  const on = MODULE_KEYS.filter((k) => modules[k]).map((k) => MODULE_LABELS[k]);
  return on.length ? `Owner sees: ${on.join(", ")}` : "No modules enabled";
}

export function OwnerModulesEditor({
  modules,
  accountStatus,
  ownerName,
  busy = false,
  onApply,
}: {
  modules: OwnerModules;
  accountStatus: AccountStatus;
  ownerName?: string;
  busy?: boolean;
  onApply: (next: OwnerModules) => void | Promise<void>;
}) {
  const [flags, setFlags] = useState<OwnerModules>(modules);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const preset = detectPreset(flags);
  const dirty = MODULE_KEYS.some((k) => flags[k] !== modules[k]);

  function requestSave() {
    if (accountStatus === "active") {
      setConfirmOpen(true);
    } else {
      void onApply(flags);
    }
  }

  return (
    <div className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#14110e]">Module access</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
          {PRESET_LABELS[preset]}
        </span>
      </div>

      <div className="mt-3">
        <PresetPicker modules={flags} onChange={setFlags} disabled={busy} />
      </div>

      <p className="mt-4 border-t border-[#14110e]/8 pt-3 text-sm text-[#5c554a]">
        {capabilitySummary(flags)}
      </p>

      <button
        type="button"
        disabled={busy || !dirty}
        onClick={requestSave}
        className={cn(
          buttonVariants({ size: "sm" }),
          "mt-3 bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
        )}
      >
        {busy ? "Saving…" : "Save access"}
      </button>
      <p className="mt-2 text-xs text-[#8a8173]">
        Applies immediately. The owner sees the change on their next sign-in (or
        within an hour).
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change module access?"
        description={
          <>
            This changes what {ownerName || "this owner"} can see and reach on
            their next sign-in. New access:{" "}
            <strong>{PRESET_LABELS[preset]}</strong>.
          </>
        }
        confirmLabel="Change access"
        busy={busy}
        onConfirm={async () => {
          await onApply(flags);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
