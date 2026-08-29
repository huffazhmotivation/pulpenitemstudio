import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { addHeroImages, deleteHeroImage, moveHeroImage, updateHomepageSettings } from "@/lib/actions/settings";
import { HERO_IMAGE_GUIDANCE } from "@/lib/constants";

export default async function AdminHomepagePage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: homepage }, { data: fonts }, { data: heroImages }] = await Promise.all([
    db.from("homepage_settings").select("*").eq("id", 1).single(),
    db.from("fonts").select("id, name").order("name"),
    db.from("hero_images").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <p className="eyebrow-accent mb-3">Content</p>
      <h1 className="mb-3 font-display text-3xl text-ink">Homepage</h1>
      <p className="mb-10 max-w-xl text-sm text-ink-soft">
        Edit the hero and about copy shown on the homepage. Featured/Latest sections pull
        automatically from fonts marked Featured or by publish date.
      </p>

      <div className="mb-6 max-w-xl space-y-4 border border-line bg-panel p-4">
        <Label>Hero gallery</Label>
        <p className="text-xs text-ink-soft">
          {HERO_IMAGE_GUIDANCE} Upload as many as you like — they auto-slide on the homepage, same as the
          product gallery. Order top-to-bottom below is the slide order.
        </p>

        {heroImages && heroImages.length > 0 && (
          <ul className="space-y-2">
            {heroImages.map((img, i) => (
              <li
                key={img.id}
                className="flex items-center gap-3 rounded-md border border-line bg-paper p-2"
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-sm border border-line">
                  <Image src={img.image_url} alt={img.alt_text ?? ""} fill className="object-cover" />
                </div>
                <span className="flex-1 truncate text-xs text-ink-soft">{img.alt_text || "Untitled"}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={moveHeroImage.bind(null, img.id, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="rounded-sm border border-line px-2 py-1 text-xs text-ink-soft hover:bg-panel-2 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveHeroImage.bind(null, img.id, "down")}>
                    <button
                      type="submit"
                      disabled={i === heroImages.length - 1}
                      className="rounded-sm border border-line px-2 py-1 text-xs text-ink-soft hover:bg-panel-2 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteHeroImage.bind(null, img.id)}>
                    <button
                      type="submit"
                      className="rounded-sm border border-line px-2 py-1 text-xs font-semibold text-sale hover:bg-panel-2"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addHeroImages} className="flex items-center gap-3">
          <input
            name="hero_images"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-panel-2"
          />
          <Button type="submit" size="sm" variant="secondary">
            Add
          </Button>
        </form>

        {(!heroImages || heroImages.length === 0) && homepage?.hero_image_url && (
          <p className="text-xs text-ink-soft">
            Gallery is empty, so the legacy single hero image below is still shown as a fallback.
          </p>
        )}
      </div>

      <form
        action={updateHomepageSettings}
        className="max-w-xl space-y-6 border border-line p-6"
      >
        {homepage?.hero_image_url && (
          <div className="space-y-3 border border-line bg-panel p-4">
            <Label htmlFor="hero_image_alt">Legacy hero image (fallback, only used if gallery above is empty)</Label>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-line">
              <Image
                src={homepage.hero_image_url}
                alt={homepage.hero_image_alt ?? "Legacy hero image"}
                fill
                className="object-cover"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="hero_image_remove" className="accent-signal" />
              Remove this legacy image
            </label>
            <Input
              id="hero_image_alt"
              name="hero_image_alt"
              placeholder="Alt text"
              defaultValue={homepage?.hero_image_alt ?? ""}
            />
          </div>
        )}

        <div>
          <Label htmlFor="hero_eyebrow">Hero eyebrow</Label>
          <Input id="hero_eyebrow" name="hero_eyebrow" defaultValue={homepage?.hero_eyebrow ?? ""} />
        </div>
        <div>
          <Label htmlFor="hero_heading">Hero heading</Label>
          <Input id="hero_heading" name="hero_heading" defaultValue={homepage?.hero_heading ?? ""} />
          <p className="mt-1 text-xs text-ink-soft">
            Shown as the big headline whenever a hero image is set above.
          </p>
        </div>
        <div>
          <Label htmlFor="hero_subheading">Hero subheading</Label>
          <Textarea id="hero_subheading" name="hero_subheading" rows={2} defaultValue={homepage?.hero_subheading ?? ""} />
        </div>
        <div>
          <Label htmlFor="hero_preview_font_id">Hero live-preview font (used when no hero image is set)</Label>
          <Select id="hero_preview_font_id" name="hero_preview_font_id" defaultValue={homepage?.hero_preview_font_id ?? ""}>
            <option value="">— Use first featured font —</option>
            {(fonts ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="hero_preview_text">Hero preview text (used when no hero image is set)</Label>
          <Input id="hero_preview_text" name="hero_preview_text" defaultValue={homepage?.hero_preview_text ?? ""} />
        </div>
        <div>
          <Label htmlFor="about_heading">About section heading</Label>
          <Input id="about_heading" name="about_heading" defaultValue={homepage?.about_heading ?? ""} />
        </div>
        <div>
          <Label htmlFor="about_body">About section body</Label>
          <Textarea id="about_body" name="about_body" rows={4} defaultValue={homepage?.about_body ?? ""} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="featured_heading">Featured section heading</Label>
            <Input id="featured_heading" name="featured_heading" defaultValue={homepage?.featured_heading ?? ""} />
          </div>
          <div>
            <Label htmlFor="latest_heading">Latest section heading</Label>
            <Input id="latest_heading" name="latest_heading" defaultValue={homepage?.latest_heading ?? ""} />
          </div>
        </div>
        <Button type="submit">Save homepage</Button>
      </form>
    </div>
  );
}
