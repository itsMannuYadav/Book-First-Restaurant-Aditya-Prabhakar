"use client";

import { useMemo } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { cn } from "@/lib/utils";

export function QrCodePanel() {
  const { restaurant, loading } = useOwnerRestaurant();

  const menuUrl = useMemo(() => {
    if (!restaurant) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${ROUTES.publicMenu(restaurant.slug)}`;
  }, [restaurant]);

  if (loading || !restaurant) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-64" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Share"
        title="QR Code"
        description="Guests scan this code to open your digital menu instantly."
      />

      {restaurant.status !== "published" ? (
        <p className="mt-6 rounded-2xl border border-[#14110e]/10 bg-white/70 px-4 py-3 text-sm text-[#7a7164]">
          Your menu is currently <strong className="text-[#14110e]">{restaurant.status}</strong>.
          Set visibility to Published on the Restaurant page so guests can view it.
        </p>
      ) : null}

      <div className="mt-8 inline-flex rounded-[1.75rem] border border-[#14110e]/8 bg-white p-7 shadow-[0_20px_50px_rgba(20,17,14,0.08)]">
        <QRCodeSVG value={menuUrl || "https://example.com"} size={220} level="M" />
      </div>

      <p className="mt-4 break-all text-sm text-[#7a7164]">{menuUrl}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={ROUTES.publicMenu(restaurant.slug)}
          target="_blank"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
          )}
        >
          Open public menu
        </Link>
        <button
          type="button"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          onClick={async () => {
            await navigator.clipboard.writeText(menuUrl);
            toast.success("Link copied");
          }}
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
