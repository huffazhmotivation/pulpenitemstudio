import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { updateSiteSettings } from "@/lib/actions/settings";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const db = await createAdminClient();
  const { data: settings } = await db.from("site_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <p className="eyebrow-accent mb-3">Studio</p>
      <h1 className="mb-3 font-display text-3xl text-ink">Settings</h1>
      <p className="mb-10 max-w-xl text-sm text-ink-soft">
        Branding and the channels customers use to order — the WhatsApp number and email below
        power the order buttons on every font page.
      </p>

      <form action={updateSiteSettings} className="max-w-xl space-y-6 border border-line p-6">
        <div>
          <Label htmlFor="studio_name">Studio name</Label>
          <Input id="studio_name" name="studio_name" defaultValue={settings?.studio_name} required />
        </div>
        <div>
          <Label htmlFor="studio_tagline">Tagline</Label>
          <Input id="studio_tagline" name="studio_tagline" defaultValue={settings?.studio_tagline ?? ""} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp number</Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              placeholder="6281234567890"
              defaultValue={settings?.whatsapp_number ?? ""}
            />
            <p className="mt-1 text-xs text-ink-soft">International format, digits only, no + or spaces.</p>
          </div>
          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={settings?.contact_email ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="instagram_handle">Instagram handle</Label>
          <Input id="instagram_handle" name="instagram_handle" placeholder="pulpenitem" defaultValue={settings?.instagram_handle ?? ""} />
        </div>
        <div>
          <Label htmlFor="address">Studio address (optional)</Label>
          <Input id="address" name="address" defaultValue={settings?.address ?? ""} />
        </div>
        <div>
          <Label htmlFor="footer_note">Footer note</Label>
          <Textarea id="footer_note" name="footer_note" rows={2} defaultValue={settings?.footer_note ?? ""} />
        </div>
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
