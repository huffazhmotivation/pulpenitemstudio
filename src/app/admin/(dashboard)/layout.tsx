import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/Toast";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-paper text-ink md:flex-row">
        <AdminNav email={user?.email ?? null} />
        <div className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
