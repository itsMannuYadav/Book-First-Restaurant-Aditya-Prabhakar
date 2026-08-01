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
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/firebase/categories";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { categorySchema, type CategoryInput } from "@/lib/validators/forms";
import type { Category } from "@/types";
import { seedStarterMenu } from "@/lib/firebase/seed-menu";
import { cn } from "@/lib/utils";

const emptyForm: CategoryInput = {
  name: "",
  icon: "",
  description: "",
  isVisible: true,
};

export function CategoriesManager() {
  const { restaurant, loading: restaurantLoading } = useOwnerRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      await seedStarterMenu(restaurant.id);
      setCategories(await listCategories(restaurant.id));
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
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      icon: category.icon ?? "",
      description: category.description ?? "",
      isVisible: category.isVisible,
    });
    setOpen(true);
  }

  async function onSave() {
    if (!restaurant) return;
    const parsed = categorySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setPending(true);
    try {
      if (editing) {
        await updateCategory(editing.id, parsed.data);
        toast.success("Category updated");
      } else {
        await createCategory(
          restaurant.id,
          parsed.data,
          categories.length,
        );
        toast.success("Category created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onDelete(category: Category) {
    if (!confirm(`Delete “${category.name}”?`)) return;
    try {
      await deleteCategory(category.id);
      toast.success("Category deleted");
      await refresh();
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    }
  }

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
        eyebrow="Menu structure"
        title="Categories"
        description="Organize your menu into clear sections guests can browse."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={cn(buttonVariants({ size: "lg" }), "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]")}
          >
            Add category
          </button>
        }
      />

      <div className="mt-8 space-y-3">
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add your first section — Starters, Mains, Desserts — then fill it with dishes."
            action={
              <button
                type="button"
                onClick={openCreate}
                className={cn(buttonVariants({ size: "lg" }), "bg-[#14110e] text-[#f4efe6] hover:bg-[#2a241c]")}
              >
                Add category
              </button>
            }
          />
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#14110e]/8 bg-white/80 px-4 py-4 shadow-sm transition-all hover:border-[#14110e]/15"
            >
              <div>
                <p className="font-medium text-[#14110e]">
                  {category.icon ? `${category.icon} ` : null}
                  {category.name}
                </p>
                {category.description ? (
                  <p className="text-sm text-[#7a7164]">
                    {category.description}
                  </p>
                ) : null}
                {!category.isVisible ? (
                  <p className="text-xs text-[#8a8173]">Hidden</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  onClick={() => openEdit(category)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "destructive", size: "sm" }),
                  )}
                  onClick={() => void onDelete(category)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Starters & Small Plates"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (optional emoji)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder="e.g. 🥗"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Short description</Label>
              <Textarea
                id="cat-desc"
                placeholder="e.g. Light bites to start the meal"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isVisible: e.target.checked,
                  }))
                }
              />
              Visible on public menu
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
