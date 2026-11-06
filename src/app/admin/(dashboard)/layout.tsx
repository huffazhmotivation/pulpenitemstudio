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
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-5 bg-paper p-3 text-ink md:flex-row md:p-5">
        <AdminNav email={user?.email ?? null} />
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-2 py-4 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
