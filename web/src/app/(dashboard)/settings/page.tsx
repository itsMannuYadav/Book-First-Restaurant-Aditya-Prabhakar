"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-[family-name:var(--font-serif-display)] text-3xl font-bold tracking-tight">
        Settings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Account details for your BookFirst workspace.
      </p>

      <div className="mt-8 space-y-2 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user?.email}</p>
      </div>

      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
        onClick={async () => {
          await signOut();
          router.replace(ROUTES.login);
        }}
      >
        Sign out
      </button>
    </div>
  );
}
