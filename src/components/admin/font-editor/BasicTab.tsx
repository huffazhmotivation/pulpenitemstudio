"use client";

import { useState } from "react";
import type { Category } from "@/lib/types/database";
import type { CoreFields } from "./types";
import { Card, FieldRow, FieldLabel, Toggle } from "./fields";

const inputClass =
  "w-full rounded-sm border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink transition-colors";
const textareaClass = `${inputClass} resize-y`;

export function BasicTab({
  values,
  setValue,
  categories,
}: {
  values: CoreFields;
  setValue: <K extends keyof CoreFields>(key: K, value: CoreFields[K]) => void;
  categories: Category[];
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card title="Basic details" description="Name, category, description, designer, and tags shown across the site.">
        <FieldRow cols={2}>
          <div>
            <FieldLabel htmlFor="name">Font name</FieldLabel>
            <input
              id="name"
              required
              value={values.name}
              onChange={(e) => setValue("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="category_id">Category</FieldLabel>
            <select
              id="category_id"
              value={values.category_id}
              onChange={(e) => setValue("category_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>

        <div className="mt-5">
          <FieldLabel htmlFor="full_description">Description</FieldLabel>
          <textarea
            id="full_description"
            rows={6}
            value={values.full_description}
            onChange={(e) => setValue("full_description", e.target.value)}
            className={textareaClass}
            placeholder="Full description shown on the font's detail page"
          />
        </div>

        <FieldRow cols={2}>
          <div className="mt-5">
            <FieldLabel htmlFor="designer">Designer</FieldLabel>
            <input
              id="designer"
              value={values.designer}
              onChange={(e) => setValue("designer", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mt-5">
            <FieldLabel htmlFor="tags">Tags</FieldLabel>
            <input
              id="tags"
              placeholder="editorial, serif, headline"
              value={values.tags}
              onChange={(e) => setValue("tags", e.target.value)}
              className={inputClass}
            />
          </div>
        </FieldRow>
      </Card>

      <Card
        title="More details"
        description="Slug, release info, language support, SEO — optional."
        action={
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            {advancedOpen ? "Hide" : "Show"}
          </button>
        }
      >
        {advancedOpen && (
          <div className="space-y-5">
            <FieldRow cols={2}>
              <div>
                <FieldLabel htmlFor="slug">Slug (URL)</FieldLabel>
                <input
                  id="slug"
                  placeholder="pulpen-serif — leave blank to auto-generate"
                  value={values.slug}
                  onChange={(e) => setValue("slug", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="short_description">Short description</FieldLabel>
                <input
                  id="short_description"
                  placeholder="One line shown on cards"
                  value={values.short_description}
                  onChange={(e) => setValue("short_description", e.target.value)}
                  className={inputClass}
                />
              </div>
            </FieldRow>

            <FieldRow cols={3}>
              <div>
                <FieldLabel htmlFor="release_year">Release year</FieldLabel>
                <input
                  id="release_year"
                  type="number"
                  value={values.release_year}
                  onChange={(e) => setValue("release_year", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="version">Version</FieldLabel>
                <input
                  id="version"
                  value={values.version}
                  onChange={(e) => setValue("version", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="default_preview_text">Default preview text</FieldLabel>
                <input
                  id="default_preview_text"
                  value={values.default_preview_text}
                  onChange={(e) => setValue("default_preview_text", e.target.value)}
                  className={inputClass}
                />
              </div>
            </FieldRow>

            <FieldRow cols={2}>
              <div>
                <FieldLabel htmlFor="language_support">Language support</FieldLabel>
                <input
                  id="language_support"
                  placeholder="Latin, Latin Extended, Vietnamese"
                  value={values.language_support}
                  onChange={(e) => setValue("language_support", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="font_features">Font features</FieldLabel>
                <input
                  id="font_features"
                  placeholder="Ligatures, Small caps, Old-style figures"
                  value={values.font_features}
                  onChange={(e) => setValue("font_features", e.target.value)}
                  className={inputClass}
                />
              </div>
            </FieldRow>

            <div className="flex flex-wrap gap-8 border-t border-line pt-5">
              <Toggle
                id="is_featured"
                checked={values.is_featured}
                onChange={(v) => setValue("is_featured", v)}
                label="Featured on homepage"
              />
              <Toggle id="is_new" checked={values.is_new} onChange={(v) => setValue("is_new", v)} label="Mark as New" />
            </div>

            <FieldRow cols={2}>
              <div>
                <FieldLabel htmlFor="seo_title">SEO title</FieldLabel>
                <input
                  id="seo_title"
                  value={values.seo_title}
                  onChange={(e) => setValue("seo_title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="meta_description">Meta description</FieldLabel>
                <input
                  id="meta_description"
                  value={values.meta_description}
                  onChange={(e) => setValue("meta_description", e.target.value)}
                  className={inputClass}
                />
              </div>
            </FieldRow>
          </div>
        )}
      </Card>
    </div>
  );
}
