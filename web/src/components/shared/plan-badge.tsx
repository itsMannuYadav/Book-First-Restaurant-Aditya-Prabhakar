import { PRESET_LABELS } from "@/constants/modules";
import { cn } from "@/lib/utils";
import type { ModulePreset } from "@/types";

const STYLES: Record<ModulePreset, string> = {
  core: "bg-[#14110e]/5 text-[#14110e]",
  billing_only: "bg-amber-100 text-amber-900",
  full: "bg-emerald-100 text-emerald-900",
  custom: "border border-[#14110e]/20 text-[#5c554a]",
};

/** Short label for an owner's plan / module preset. */
export function PlanBadge({
  preset,
  className,
}: {
  preset: ModulePreset;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STYLES[preset],
        className,
      )}
    >
      {PRESET_LABELS[preset]}
    </span>
  );
}
