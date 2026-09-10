"use client";

import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { BillEditor } from "@/features/billing/components/bill-editor";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewBillPage() {
  const { restaurant, loading } = useOwnerRestaurant();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rounded-2xl border border-[#14110e]/10 px-4 py-3 text-sm text-[#5c554a]">
        Set up your restaurant profile first, then you can raise bills.
      </div>
    );
  }

  return <BillEditor restaurant={restaurant} />;
}
