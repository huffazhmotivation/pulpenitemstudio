"use client";

import { useCallback, useState } from "react";
import { updateFont } from "@/lib/actions/fonts";
import type {
  Category,
  FontFile,
  FontImage,
  FontRow,
  FontStyle,
  License,
  LicensePrice,
} from "@/lib/types/database";
import { StickyBar } from "./StickyBar";
import { TabNav, type TabDef } from "./TabNav";
import { BasicTab } from "./BasicTab";
import { GalleryTab } from "./GalleryTab";
import { FontFilesTab } from "./FontFilesTab";
import { PricingTab } from "./PricingTab";
import { PublishTab } from "./PublishTab";
import { coreFieldsToFormData, fontToCoreFields, type CoreFields } from "./types";
import { useSavedAction } from "./useSavedAction";

const TABS: TabDef[] = [
  { id: "basic", label: "Basic" },
  { id: "gallery", label: "Gallery" },
  { id: "files", label: "Font Files" },
  { id: "pricing", label: "Pricing" },
  { id: "publish", label: "Publish" },
];

export function FontEditorShell({
  font,
  categories,
  licenses,
  licensePrices,
  styles,
  files,
  images,
}: {
  font: FontRow;
  categories: Category[];
  licenses: License[];
  licensePrices: LicensePrice[];
  styles: FontStyle[];
  files: FontFile[];
  images: FontImage[];
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [values, setValues] = useState<CoreFields>(() => fontToCoreFields(font));
  const core = useSavedAction();

  const setValue = useCallback(<K extends keyof CoreFields>(key: K, value: CoreFields[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(
    (status: "draft" | "published") => {
      const fd = coreFieldsToFormData({ ...values, status });
      core.run(() => updateFont(font.id, fd), {
        successMessage: status === "published" ? "Font published." : "Draft saved.",
      });
      setValues((prev) => ({ ...prev, status }));
    },
    [values, core, font.id]
  );

  const hasCover = !!font.cover_image_url || images.length > 0;
  const hasStyle = styles.length > 0;
  const hasPreviewFile = files.some((f) => f.file_type === "preview");

  return (
    <div>
      <StickyBar
        fontName={values.name}
        saveState={core.state}
        onSaveDraft={() => save("draft")}
        onPublish={() => save("published")}
        disabled={core.isPending}
        status={values.status}
      />

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">Fonts</p>
          <h1 className="text-2xl font-semibold text-ink">{values.name || "Untitled font"}</h1>
        </div>
        <a
          href={`/fonts/${font.slug}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          View live page →
        </a>
      </div>

      <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className={activeTab === "basic" ? "block" : "hidden"}>
        <BasicTab values={values} setValue={setValue} categories={categories} />
      </div>
      <div className={activeTab === "gallery" ? "block" : "hidden"}>
        <GalleryTab fontId={font.id} images={images} coverImageUrl={font.cover_image_url} />
      </div>
      <div className={activeTab === "files" ? "block" : "hidden"}>
        <FontFilesTab fontId={font.id} styles={styles} files={files} />
      </div>
      <div className={activeTab === "pricing" ? "block" : "hidden"}>
        <PricingTab
          fontId={font.id}
          values={values}
          setValue={setValue}
          licenses={licenses}
          licensePrices={licensePrices}
        />
      </div>
      <div className={activeTab === "publish" ? "block" : "hidden"}>
        <PublishTab
          values={values}
          fontId={font.id}
          hasCover={hasCover}
          hasStyle={hasStyle}
          hasPreviewFile={hasPreviewFile}
          onSaveDraft={() => save("draft")}
          onPublish={() => save("published")}
          saving={core.isPending}
        />
      </div>
    </div>
  );
}
