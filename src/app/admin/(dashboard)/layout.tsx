import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/Toast";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-5 bg-paper p-3 text-ink md:flex-row md:p-5">
        <AdminNav email={admin.email} />
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-2 py-4 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
