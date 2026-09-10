"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { useBill } from "@/features/billing/hooks/use-bill";
import { BillEditor } from "@/features/billing/components/bill-editor";
import { BillDetail } from "@/features/billing/components/bill-detail";

export default function BillPage() {
  const { billId } = useParams<{ billId: string }>();
  const { restaurant, loading: restaurantLoading } = useOwnerRestaurant();
  const { bill, loading, error, setBill } = useBill(billId);

  if (loading || restaurantLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error ?? "This bill was not found."}
        </div>
        <Link
          href={ROUTES.billing}
          className="text-sm text-[#8a8173] underline underline-offset-2"
        >
          Back to bills
        </Link>
      </div>
    );
  }

  if (bill.status === "draft") {
    if (!restaurant) {
      return (
        <div className="rounded-2xl border border-[#14110e]/10 px-4 py-3 text-sm text-[#5c554a]">
          Set up your restaurant profile first.
        </div>
      );
    }
    return <BillEditor restaurant={restaurant} bill={bill} />;
  }

  return <BillDetail bill={bill} onChange={setBill} />;
}
