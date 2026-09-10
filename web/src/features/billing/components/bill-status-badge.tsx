import { BILL_STATUS_LABELS } from "@/constants/billing";
import { cn } from "@/lib/utils";
import type { BillStatus } from "@/types";

const STYLES: Record<BillStatus, string> = {
  draft: "bg-[#14110e]/5 text-[#14110e]",
  finalized: "bg-blue-100 text-blue-900",
  paid: "bg-emerald-100 text-emerald-900",
  void: "bg-destructive/10 text-destructive",
};

export function BillStatusBadge({
  status,
  className,
}: {
  status: BillStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      {BILL_STATUS_LABELS[status]}
    </span>
  );
}
