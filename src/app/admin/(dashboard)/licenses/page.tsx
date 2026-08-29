import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { createLicense, deleteLicense, updateLicense } from "@/lib/actions/taxonomy";

export default async function AdminLicensesPage() {
  await requireAdmin();
  const db = await createAdminClient();
  const { data: licenses } = await db.from("licenses").select("*").order("sort_order");

  return (
    <div>
      <p className="eyebrow-accent mb-3">Taxonomy</p>
      <h1 className="mb-3 font-display text-3xl text-ink">Licenses</h1>
      <p className="mb-10 max-w-xl text-sm text-ink-soft">
        License *types* (Desktop, Web, App, Corporate…). Set the per-font price for each one from
        the font&apos;s edit page.
      </p>

      <div className="space-y-4 mb-12">
        {(licenses ?? []).map((lic) => (
          <form
            key={lic.id}
            action={updateLicense.bind(null, lic.id)}
            className="grid grid-cols-1 gap-3 border border-line p-4 sm:grid-cols-[1fr_1fr_2fr_80px_auto_auto]"
          >
            <Input name="name" defaultValue={lic.name} placeholder="Name" required />
            <Input name="slug" defaultValue={lic.slug} placeholder="slug" />
            <Input name="description" defaultValue={lic.description ?? ""} placeholder="Description" />
            <Input name="sort_order" type="number" defaultValue={lic.sort_order} />
            <Button type="submit" size="sm" variant="secondary">Save</Button>
            <button
              formAction={deleteLicense.bind(null, lic.id)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft hover:text-signal"
            >
              Delete
            </button>
          </form>
        ))}
        {(!licenses || licenses.length === 0) && (
          <p className="text-sm text-ink-soft">No license types yet — add one below.</p>
        )}
      </div>

      <form action={createLicense} className="grid grid-cols-1 gap-3 border border-dashed border-line p-4 sm:grid-cols-[1fr_1fr_2fr_80px_auto]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Desktop" />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" name="slug" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Install on up to 5 desktop seats." />
        </div>
        <div>
          <Label htmlFor="sort_order">Order</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
        </div>
        <div className="flex items-end">
          <Button type="submit">Add license</Button>
        </div>
      </form>
    </div>
  );
}
