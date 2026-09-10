"use client";

import { useState } from "react";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  MODULE_PRESETS,
  PRESET_LABELS,
  PRESET_SHORT,
  detectPreset,
} from "@/constants/modules";
import { cn } from "@/lib/utils";
import type { ModulePreset, OwnerModules } from "@/types";

const PRESET_CHOICES: Array<Exclude<ModulePreset, "custom">> = [
  "core",
  "billing_only",
  "full",
];

/** Controlled 3-way plan selector, with an optional advanced per-module override. */
export function PresetPicker({
  modules,
  onChange,
  compact = false,
  disabled = false,
}: {
  modules: OwnerModules;
  onChange: (next: OwnerModules) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const preset = detectPreset(modules);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <div
        className={cn(
          "inline-flex rounded-xl bg-[#14110e]/5",
          compact ? "flex-nowrap gap-0.5 p-0.5" : "flex-wrap gap-1 p-1",
        )}
      >
        {PRESET_CHOICES.map((name) => {
          const active = preset === name;
          return (
            <button
              key={name}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...MODULE_PRESETS[name] })}
              className={cn(
                "rounded-lg font-medium whitespace-nowrap transition-colors disabled:opacity-50",
                compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-sm",
                active
                  ? "bg-white text-[#14110e] shadow-sm"
                  : "text-[#7a7164] hover:text-[#14110e]",
              )}
            >
              {compact ? PRESET_SHORT[name] : PRESET_LABELS[name]}
            </button>
          );
        })}
        {preset === "custom" ? (
          <span
            className={cn(
              "rounded-lg bg-white font-medium text-[#14110e] shadow-sm whitespace-nowrap",
              compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-sm",
            )}
          >
            Custom
          </span>
        ) : null}
      </div>

      {!compact ? (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-medium text-[#8a8173] underline underline-offset-2 hover:text-[#14110e]"
          >
            {showAdvanced ? "Hide" : "Advanced"} per-module toggles
          </button>
          {showAdvanced ? (
            <div className="mt-2 space-y-2 rounded-xl border border-[#14110e]/8 bg-white p-3">
              {MODULE_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-sm text-[#14110e]"
                >
                  {MODULE_LABELS[key]}
                  <input
                    type="checkbox"
                    checked={modules[key]}
                    disabled={disabled}
                    onChange={() =>
                      onChange({ ...modules, [key]: !modules[key] })
                    }
                    className="size-4 accent-[#14110e]"
                  />
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
