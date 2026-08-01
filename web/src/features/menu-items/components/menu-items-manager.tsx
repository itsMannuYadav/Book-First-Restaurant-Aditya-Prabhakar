"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOwnerRestaurant } from "@/features/restaurant/hooks/use-owner-restaurant";
import { listCategories } from "@/lib/firebase/categories";
import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "@/lib/firebase/menu-items";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { seedStarterMenu } from "@/lib/firebase/seed-menu";
import { menuItemSchema, type MenuItemInput } from "@/lib/validators/forms";
import type { Category, MenuItemRecord } from "@/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

const TAG_OPTIONS = [
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non-veg" },
  { id: "vegan", label: "Vegan" },
  { id: "gf", label: "Gluten-free" },
] as const;

const emptyForm: MenuItemInput = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  badge: "",
  tags: [],
  isAvailable: true,
};

export function MenuItemsManager() {
  const { restaurant, loading: restaurantLoading } = useOwnerRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemRecord | null>(null);
  const [form, setForm] = useState<MenuItemInput>(emptyForm);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      await seedStarterMenu(restaurant.id);
      const [nextCategories, nextItems] = await Promise.all([
        listCategories(restaurant.id),
        listMenuItems(restaurant.id),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setOpen(true);
  }

  function openEdit(item: MenuItemRecord) {
    setEditing(item);
    setForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      badge: item.badge ?? "",
      tags: item.tags,
      isAvailable: item.isAvailable,
    });
    setOpen(true);
  }

  function toggleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function onSave() {
    if (!restaurant) return;
    const parsed = menuItemSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setPending(true);
    try {
      if (editing) {
        await updateMenuItem(editing.id, parsed.data);
        toast.success("Item updated");
      } else {
        await createMenuItem(restaurant.id, parsed.data, items.length);
        toast.success("Item created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onDelete(item: MenuItemRecord) {
    if (!confirm(`Delete “${item.name}”?`)) return;
    try {
      await deleteMenuItem(item.id);
      toast.success("Item deleted");
      await refresh();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  }

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  if (restaurantLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Catalog"
        title="Menu Items"
        description="Add dishes, prices, badges, and dietary tags."
        action={
          <button
            type="button"
            onClick={openCreate}
            disabled={categories.length === 0}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
            )}
          >
            Add item
          </button>
        }
      />

      {categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Add a category first"
            description="Menu items belong to a category. Create one, then come back here."
            action={
              <Link
                href={ROUTES.categories}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                )}
              >
                Go to Categories
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {categories.length > 0 && items.length === 0 ? (
          <EmptyState
            title="No menu items yet"
            description="Add your first dish — guests will see it on the public menu instantly."
            action={
              <button
                type="button"
                onClick={openCreate}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]",
                )}
              >
                Add item
              </button>
            }
          />
        ) : null}
        {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#14110e]/8 bg-white/80 px-4 py-4 shadow-sm transition-all hover:border-[#14110e]/15"
            >
              <div>
                <p className="font-medium text-[#14110e]">
                  {item.name}{" "}
                  <span className="text-[#7a7164]">
                    · {restaurant?.currency}
                    {item.price}
                  </span>
                </p>
                <p className="text-sm text-[#7a7164]">
                  {categoryName(item.categoryId)}
                  {item.badge ? ` · ${item.badge}` : ""}
                  {!item.isAvailable ? " · Unavailable" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "destructive", size: "sm" }),
                  )}
                  onClick={() => void onDelete(item)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "New item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                step="1"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-badge">Badge</Label>
              <Input
                id="item-badge"
                placeholder="Chef's Special"
                value={form.badge}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, badge: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      buttonVariants({
                        variant: form.tags.includes(tag.id)
                          ? "default"
                          : "outline",
                        size: "sm",
                      }),
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isAvailable: e.target.checked,
                  }))
                }
              />
              Available
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              className={cn(buttonVariants())}
              disabled={pending}
              onClick={() => void onSave()}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
