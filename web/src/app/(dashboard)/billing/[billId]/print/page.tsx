"use client";

import { useParams } from "next/navigation";
import { useBill } from "@/features/billing/hooks/use-bill";
import { BillPrintView } from "@/features/billing/components/bill-print-view";

export default function BillPrintPage() {
  const { billId } = useParams<{ billId: string }>();
  const { bill, loading, error } = useBill(billId);

  if (loading) {
    return <div className="p-10 text-sm text-[#8a8173]">Loading invoice…</div>;
  }
  if (error || !bill) {
    return <div className="p-10 text-sm text-destructive">Bill not found.</div>;
  }
  return <BillPrintView bill={bill} />;
}
