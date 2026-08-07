"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types";

type OverviewResponse = {
  pendingApprovals: number;
  suspendedOwners: number;
  totalOwners: number;
  totalRestaurants: number;
  publishedRestaurants: number;
  recentRestaurants: Array<Restaurant & { ownerEmail?: string }>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void adminFetch<OverviewResponse>("/api/admin/overview")
      .then((next) => {
        if (cancelled) return;
        startTransition(() => {
          setData(next);
          setLoading(false);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        startTransition(() => {
          setError(
            err instanceof AdminApiError
              ? err.message
              : "Failed to load admin overview.",
          );
          setLoading(false);
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error ?? "No data"}
      </div>
    );
  }

  const cards = [
    {
      label: "Pending approvals",
      value: data.pendingApprovals,
      href: ROUTES.adminApprovals,
    },
    {
      label: "Suspended owners",
      value: data.suspendedOwners,
      href: ROUTES.adminOwners,
    },
    {
      label: "Published menus",
      value: data.publishedRestaurants,
      href: ROUTES.adminRestaurants,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team console"
        description={`${data.totalOwners} owners · ${data.totalRestaurants} restaurants`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-3xl border border-[#14110e]/8 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm text-[#7a7164]">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-bold text-[#14110e]">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#14110e]">
            Recent restaurants
          </h2>
          <Link
            href={ROUTES.adminRestaurants}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#14110e]/8 bg-white">
          {data.recentRestaurants.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#7a7164]">No restaurants yet.</p>
          ) : (
            <ul className="divide-y divide-[#14110e]/8">
              {data.recentRestaurants.map((restaurant) => (
                <li key={restaurant.id}>
                  <Link
                    href={ROUTES.adminRestaurant(restaurant.id)}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-[#14110e]/[0.03]"
                  >
                    <div>
                      <p className="font-medium text-[#14110e]">
                        {restaurant.name}
                      </p>
                      <p className="text-xs text-[#7a7164]">
                        /m/{restaurant.slug}
                        {restaurant.ownerEmail
                          ? ` · ${restaurant.ownerEmail}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#5c554a]">
                      {restaurant.approvalStatus} · {restaurant.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
