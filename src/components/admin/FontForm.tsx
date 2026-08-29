import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import type { Category, FontRow } from "@/lib/types/database";

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6">
      <div className="mb-5 border-b border-line pb-4">
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-xs text-ink-soft">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function FontForm({
  font,
  categories,
  action,
}: {
  font?: FontRow;
  categories: Category[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-6">
      <FieldGroup title="Basic" description="Name, category, description, designer, and tags.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Font name</Label>
            <Input id="name" name="name" required defaultValue={font?.name} />
          </div>
          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" name="category_id" defaultValue={font?.category_id ?? ""}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-5">
          <Label htmlFor="full_description">Description</Label>
          <Textarea id="full_description" name="full_description" rows={5} defaultValue={font?.full_description ?? ""} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="designer">Designer</Label>
            <Input id="designer" name="designer" defaultValue={font?.designer ?? ""} />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" placeholder="editorial, serif, headline" defaultValue={font?.tags?.join(", ")} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Pricing" description="Base price. License prices and sale settings can be set after creating.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Regular price</Label>
            <Input id="price" name="price" type="number" step="0.01" defaultValue={font?.price ?? 0} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={font?.currency ?? "USD"} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="More details" description="Optional — slug, release info, and SEO overrides.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="slug">Slug (URL) — leave blank to auto-generate</Label>
            <Input id="slug" name="slug" placeholder="pulpen-serif" defaultValue={font?.slug} />
          </div>
          <div>
            <Label htmlFor="short_description">Short description</Label>
            <Input
              id="short_description"
              name="short_description"
              placeholder="One line shown on cards"
              defaultValue={font?.short_description ?? ""}
            />
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="release_year">Release year</Label>
            <Input id="release_year" name="release_year" type="number" defaultValue={font?.release_year ?? ""} />
          </div>
          <div>
            <Label htmlFor="version">Version</Label>
            <Input id="version" name="version" defaultValue={font?.version ?? "1.0"} />
          </div>
          <div>
            <Label htmlFor="default_preview_text">Default preview text</Label>
            <Input
              id="default_preview_text"
              name="default_preview_text"
              defaultValue={font?.default_preview_text ?? "The quick brown fox jumps over the lazy dog"}
            />
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="language_support">Language support (comma separated)</Label>
            <Input
              id="language_support"
              name="language_support"
              placeholder="Latin, Latin Extended, Vietnamese"
              defaultValue={font?.language_support?.join(", ")}
            />
          </div>
          <div>
            <Label htmlFor="font_features">Font features (comma separated)</Label>
            <Input
              id="font_features"
              name="font_features"
              placeholder="Ligatures, Small caps, Old-style figures"
              defaultValue={font?.font_features?.join(", ")}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-8">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_featured" defaultChecked={font?.is_featured} className="accent-signal" />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_new" defaultChecked={font?.is_new} className="accent-signal" />
            Mark as New
          </label>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="seo_title">SEO title</Label>
            <Input id="seo_title" name="seo_title" defaultValue={font?.seo_title ?? ""} />
          </div>
          <div>
            <Label htmlFor="meta_description">Meta description</Label>
            <Input id="meta_description" name="meta_description" defaultValue={font?.meta_description ?? ""} />
          </div>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="status"
          value="draft"
          className="rounded-md border border-ink bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Save as draft
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          className="rounded-md border border-ink bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-signal-dim"
        >
          Publish
        </button>
      </div>
    </form>
  );
}
