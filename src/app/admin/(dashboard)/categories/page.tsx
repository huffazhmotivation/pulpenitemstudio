import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/taxonomy";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const db = createAdminClient();
  const { data: categories } = await db.from("categories").select("*").order("sort_order");

  return (
    <div>
      <p className="eyebrow-accent mb-3">Taxonomy</p>
      <h1 className="mb-10 font-display text-3xl text-ink">Categories</h1>

      <div className="space-y-4 mb-12">
        {(categories ?? []).map((cat) => (
          <form
            key={cat.id}
            action={updateCategory.bind(null, cat.id)}
            className="grid grid-cols-1 gap-3 border border-line p-4 sm:grid-cols-[1fr_1fr_2fr_80px_auto_auto]"
          >
            <Input name="name" defaultValue={cat.name} placeholder="Name" required />
            <Input name="slug" defaultValue={cat.slug} placeholder="slug" />
            <Input name="description" defaultValue={cat.description ?? ""} placeholder="Description" />
            <Input name="sort_order" type="number" defaultValue={cat.sort_order} />
            <Button type="submit" size="sm" variant="secondary">Save</Button>
            <button
              formAction={deleteCategory.bind(null, cat.id)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft hover:text-signal"
            >
              Delete
            </button>
          </form>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-sm text-ink-soft">No categories yet — add one below.</p>
        )}
      </div>

      <form action={createCategory} className="grid grid-cols-1 gap-3 border border-dashed border-line p-4 sm:grid-cols-[1fr_1fr_2fr_80px_auto]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" name="slug" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
        <div>
          <Label htmlFor="sort_order">Order</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
        </div>
        <div className="flex items-end">
          <Button type="submit">Add category</Button>
        </div>
      </form>
    </div>
  );
}
