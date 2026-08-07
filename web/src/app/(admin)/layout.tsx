import { RequireAdmin } from "@/features/admin/components/require-admin";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
