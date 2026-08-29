"use client";

import { deleteFont } from "@/lib/actions/fonts";
import type { CoreFields } from "./types";
import { Card } from "./fields";

interface ChecklistItem {
  label: string;
  done: boolean;
}

export function PublishTab({
  values,
  fontId,
  hasCover,
  hasStyle,
  hasPreviewFile,
  onSaveDraft,
  onPublish,
  saving,
}: {
  values: CoreFields;
  fontId: string;
  hasCover: boolean;
  hasStyle: boolean;
  hasPreviewFile: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving: boolean;
}) {
  const items: ChecklistItem[] = [
    { label: "Font name set", done: values.name.trim().length > 0 },
    { label: "Category selected", done: values.category_id.trim().length > 0 },
    { label: "Description added", done: values.full_description.trim().length > 0 },
    { label: "Cover image uploaded", done: hasCover },
    { label: "At least one style added", done: hasStyle },
    { label: "Preview font file uploaded", done: hasPreviewFile },
    { label: "Regular price set", done: Number(values.price) > 0 },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const complete = doneCount === items.length;

  return (
    <div className="space-y-6">
      <Card
        title="Completion status"
        description={`${doneCount} of ${items.length} steps complete${complete ? " — ready to publish." : "."}`}
      >
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-ink transition-all duration-300"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-sm">
              <span
                className={
                  item.done
                    ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
                    : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line"
                }
              >
                {item.done && (
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={item.done ? "text-ink" : "text-ink-soft"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Status"
        description={
          values.status === "published"
            ? "This font is live on the public site."
            : "This font is a draft and hidden from the public site."
        }
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onSaveDraft}
            className="rounded-md border border-ink bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            Save as draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onPublish}
            className="rounded-md border border-ink bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-signal-dim disabled:opacity-40"
          >
            {values.status === "published" ? "Update & keep published" : "Publish"}
          </button>
        </div>
      </Card>

      <Card title="Danger zone" className="border-sale/40">
        <p className="mb-4 text-sm text-ink-soft">
          Permanently deletes this font, its files, images, and license prices. This can&apos;t be undone.
        </p>
        <form action={deleteFont.bind(null, fontId)}>
          <button
            type="submit"
            className="rounded-md border border-sale px-5 py-2.5 text-sm text-sale transition-colors hover:bg-sale hover:text-paper"
          >
            Delete font
          </button>
        </form>
      </Card>
    </div>
  );
}
