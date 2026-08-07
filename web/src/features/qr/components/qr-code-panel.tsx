"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { canPublishRestaurant } from "@/lib/firebase/users";
import { cn } from "@/lib/utils";

export function QrCodePanel() {
  const { profile } = useAuth();
  const { restaurant, loading } = useOwnerRestaurant();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const menuUrl = useMemo(() => {
    if (!restaurant) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${ROUTES.publicMenu(restaurant.slug)}`;
  }, [restaurant]);

  function downloadQr() {
    const source = canvasRef.current;
    if (!source || !restaurant) {
      toast.error("QR code is not ready yet. Try again in a moment.");
      return;
    }

    // Draw onto a larger white canvas for print-friendly downloads.
    const size = 1024;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = size;
    exportCanvas.height = size;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      toast.error("Could not prepare the download.");
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(source, 0, 0, size, size);

    const link = document.createElement("a");
    link.download = `${restaurant.slug || "menu"}-qr-code.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
  }

  if (loading || !restaurant) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-64" />
      </div>
    );
  }

  const publishAllowed = canPublishRestaurant({
    accountStatus: profile?.accountStatus ?? "active",
    approvalStatus: restaurant.approvalStatus,
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Share"
        title="QR Code"
        description="Guests scan this code to open your digital menu instantly."
      />

      {!publishAllowed ? (
        <p className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Waiting for approval.</strong> You can preview this QR, but
          please wait until our team approves your account and you publish the
          menu before printing or sharing it with guests.
        </p>
      ) : restaurant.status !== "published" ? (
        <p className="mt-6 rounded-2xl border border-[#14110e]/10 bg-white/70 px-4 py-3 text-sm text-[#7a7164]">
          Your menu is currently{" "}
          <strong className="text-[#14110e]">{restaurant.status}</strong>.
          Set visibility to Published on the Restaurant page so guests can view
          it.
        </p>
      ) : null}

      <div className="mt-8 inline-flex rounded-[1.75rem] border border-[#14110e]/8 bg-white p-7 shadow-[0_20px_50px_rgba(20,17,14,0.08)]">
        <QRCodeCanvas
          value={menuUrl || "https://example.com"}
          size={220}
          level="M"
          includeMargin
          ref={canvasRef}
        />
      </div>

      <p className="mt-4 break-all text-sm text-[#7a7164]">{menuUrl}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadQr}
          className={cn(
            buttonVariants({ size: "lg" }),
            "gap-2 bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
          )}
        >
          <Download className="size-4" />
          Download QR
        </button>
        <Link
          href={ROUTES.publicMenu(restaurant.slug)}
          target="_blank"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
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
