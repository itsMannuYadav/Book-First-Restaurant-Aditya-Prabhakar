"use client";

import { useState } from "react";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  MODULE_PRESETS,
  PRESET_LABELS,
  detectPreset,
} from "@/constants/modules";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModulePreset, OwnerModules } from "@/types";

const PRESET_CHOICES: Array<Exclude<ModulePreset, "custom">> = [
  "core",
  "billing_only",
  "full",
];

export function OwnerModulesEditor({
  modules,
  busy = false,
  onApply,
}: {
  modules: OwnerModules;
  busy?: boolean;
  onApply: (next: OwnerModules) => void | Promise<void>;
}) {
  const [flags, setFlags] = useState<OwnerModules>(modules);
  const preset = detectPreset(flags);
  const dirty = MODULE_KEYS.some((k) => flags[k] !== modules[k]);

  function choosePreset(name: Exclude<ModulePreset, "custom">) {
    setFlags({ ...MODULE_PRESETS[name] });
  }

  function toggle(key: (typeof MODULE_KEYS)[number]) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="rounded-2xl border border-[#14110e]/8 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#14110e]">Module access</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
          {PRESET_LABELS[preset]}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {PRESET_CHOICES.map((name) => {
          const active = preset === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => choosePreset(name)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "border-[#14110e] bg-[#14110e] text-[#f4efe6]"
                  : "border-[#14110e]/12 bg-white text-[#5c554a] hover:border-[#14110e]/30",
              )}
            >
              <span className="font-medium">{PRESET_LABELS[name]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 border-t border-[#14110e]/8 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8a8173]">
          Advanced
        </p>
        {MODULE_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 text-sm text-[#14110e]"
          >
            {MODULE_LABELS[key]}
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={() => toggle(key)}
              className="size-4 accent-[#14110e]"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={busy || !dirty}
        onClick={() => void onApply(flags)}
        className={cn(
          buttonVariants({ size: "sm" }),
          "mt-4 bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
        )}
      >
        {busy ? "Saving…" : "Save access"}
      </button>
      <p className="mt-2 text-xs text-[#8a8173]">
        Applies immediately. The owner sees the change on their next sign-in
        (or within an hour).
      </p>
    </div>
  );
}
