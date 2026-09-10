import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ModuleGuard } from "@/features/dashboard/components/module-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardShell>
        <ModuleGuard>{children}</ModuleGuard>
      </DashboardShell>
    </RequireAuth>
  );
}
