"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { adminFetch, AdminApiError } from "@/lib/admin/api-client";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type {
  Restaurant,
  RestaurantApprovalStatus,
  RestaurantStatus,
} from "@/types";
import type { MenuThemeId } from "@/types";

type RestaurantRow = Restaurant & { ownerEmail?: string };

export default function AdminRestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    address: "",
    phone: "",
    timing: "",
    currency: "₹",
    theme: "rustic" as MenuThemeId,
    status: "draft" as RestaurantStatus,
    approvalStatus: "pending" as RestaurantApprovalStatus,
    orderingEnabled: false,
    requireGuestGps: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ restaurant: RestaurantRow }>(
        `/api/admin/restaurants/${id}`,
      );
      setRestaurant(data.restaurant);
      setForm({
        name: data.restaurant.name,
        slug: data.restaurant.slug,
        tagline: data.restaurant.tagline ?? "",
        description: data.restaurant.description ?? "",
        address: data.restaurant.address ?? "",
        phone: data.restaurant.phone ?? "",
        timing: data.restaurant.timing ?? "",
        currency: data.restaurant.currency,
        theme: data.restaurant.theme,
        status: data.restaurant.status,
        approvalStatus: data.restaurant.approvalStatus,
        orderingEnabled: data.restaurant.orderingEnabled,
        requireGuestGps: data.restaurant.requireGuestGps,
      });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Failed to load restaurant",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void refresh();
  }, [refresh]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminFetch<{ restaurant: RestaurantRow }>(
        `/api/admin/restaurants/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(form),
        },
      );
      setRestaurant(data.restaurant);
      toast.success("Restaurant updated");
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "Save failed",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <p className="text-sm text-destructive">Restaurant not found.</p>
    );
  }

  return (
    <div>
      <PageHeader
        title={restaurant.name}
        description={`Owner ${restaurant.ownerEmail ?? restaurant.ownerId}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.adminRestaurantMenu(id)}
              className={cn(buttonVariants())}
            >
              Menu + CSV
            </Link>
            <Link
              href={ROUTES.publicMenu(restaurant.slug)}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open public menu
            </Link>
          </div>
        }
      />

      <form
        onSubmit={(e) => void onSave(e)}
        className="mt-6 grid gap-4 rounded-3xl border border-[#14110e]/8 bg-white p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={form.tagline}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tagline: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timing">Timing</Label>
            <Input
              id="timing"
              value={form.timing}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, timing: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currency: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={form.theme}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  theme: e.target.value as MenuThemeId,
                }))
              }
            >
              <option value="dark">Dark</option>
              <option value="rustic">Rustic</option>
              <option value="minimal">Minimal</option>
              <option value="savan">Savan</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as RestaurantStatus,
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="approvalStatus">Approval</Label>
            <select
              id="approvalStatus"
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={form.approvalStatus}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  approvalStatus: e.target.value as RestaurantApprovalStatus,
                }))
              }
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.orderingEnabled}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  orderingEnabled: e.target.checked,
                }))
              }
            />
            Ordering enabled
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.requireGuestGps}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  requireGuestGps: e.target.checked,
                }))
              }
            />
            Require guest GPS
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn(buttonVariants({ size: "lg" }), "w-fit")}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
