"use client";

import { useState } from "react";
import {
  addFontStyle,
  deleteFontFile,
  deleteFontStyle,
  uploadFontFile,
} from "@/lib/actions/fonts";
import { formatBytes } from "@/lib/utils";
import type { FontFile, FontStyle } from "@/lib/types/database";
import { Card, EmptyState, dashedUpload } from "./fields";
import { SavedIndicator } from "@/components/admin/Toast";
import { useSavedAction } from "./useSavedAction";

export function FontFilesTab({
  fontId,
  styles,
  files,
}: {
  fontId: string;
  styles: FontStyle[];
  files: FontFile[];
}) {
  const sortedStyles = [...styles].sort((a, b) => a.sort_order - b.sort_order);
  const unlinked = files.filter((f) => !f.style_id);

  return (
    <div className="space-y-6">
      {sortedStyles.length === 0 && (
        <Card title="Styles" description="Add Regular, Italic, Bold, or a custom style to start uploading files.">
          <EmptyState>No styles yet — add the first one below.</EmptyState>
        </Card>
      )}

      {sortedStyles.map((style) => (
        <StyleCard
          key={style.id}
          fontId={fontId}
          style={style}
          files={files.filter((f) => f.style_id === style.id)}
        />
      ))}

      {unlinked.length > 0 && (
        <Card title="Unlinked files" description="Uploaded without a style — link them by re-uploading under a style above, or remove them.">
          <FileList fontId={fontId} files={unlinked} />
        </Card>
      )}

      <AddStyleCard fontId={fontId} nextOrder={sortedStyles.length} />
    </div>
  );
}

function StyleCard({ fontId, style, files }: { fontId: string; style: FontStyle; files: FontFile[] }) {
  const previews = files.filter((f) => f.file_type === "preview");
  const masters = files.filter((f) => f.file_type === "master");
  const upload = useSavedAction();
  const removeStyle = useSavedAction();

  function handleUpload(fileType: "preview" | "master", file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("file_type", fileType);
    fd.set("style_id", style.id);
    upload.run(() => uploadFontFile(fontId, fd), {
      successMessage: `${fileType === "preview" ? "Preview" : "Master"} file uploaded.`,
    });
  }

  return (
    <Card
      title={`${style.name}${style.is_italic ? " · italic" : ""}`}
      description={`Weight ${style.weight}`}
      action={
        <span className="flex items-center gap-3">
          <SavedIndicator state={upload.state === "idle" ? "idle" : upload.state} />
          <button
            type="button"
            disabled={removeStyle.isPending}
            onClick={() =>
              removeStyle.run(() => deleteFontStyle(fontId, style.id), { successMessage: "Style removed." })
            }
            className="text-xs font-semibold text-sale hover:opacity-70"
          >
            Remove style
          </button>
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Preview (WOFF2 / WOFF)
          </p>
          <FileList fontId={fontId} files={previews} compact />
          <input
            type="file"
            accept=".woff2,.woff"
            className={`${dashedUpload} mt-2`}
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("preview", file);
              e.target.value = "";
            }}
          />
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Master (OTF / TTF / ZIP)
          </p>
          <FileList fontId={fontId} files={masters} compact />
          <input
            type="file"
            accept=".otf,.ttf,.zip"
            className={`${dashedUpload} mt-2`}
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("master", file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </Card>
  );
}

function FileList({ fontId, files, compact }: { fontId: string; files: FontFile[]; compact?: boolean }) {
  const remove = useSavedAction();
  if (files.length === 0) {
    return compact ? (
      <p className="rounded-md border border-dashed border-line bg-paper/60 px-3 py-4 text-center text-[11px] text-ink-soft">
        No file yet.
      </p>
    ) : (
      <EmptyState>No files uploaded yet.</EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-line rounded-md border border-line text-sm">
      {files.map((f) => (
        <li key={f.id} className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="flex items-center gap-2 truncate">
            <span className="rounded-sm border border-line px-1.5 py-0.5 text-[10px] uppercase text-ink-soft">
              {f.format}
            </span>
            <span className="text-ink-soft">{formatBytes(f.file_size)}</span>
          </span>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.run(() => deleteFontFile(fontId, f.id), { successMessage: "File removed." })}
            className="shrink-0 font-semibold uppercase tracking-[0.06em] text-ink-soft hover:text-sale"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddStyleCard({ fontId, nextOrder }: { fontId: string; nextOrder: number }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(400);
  const [italic, setItalic] = useState(false);
  const add = useSavedAction();

  function submit() {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("weight", String(weight));
    if (italic) fd.set("is_italic", "on");
    add.run(() => addFontStyle(fontId, fd), { successMessage: `Style "${name.trim()}" added.` });
    setName("");
    setWeight(400);
    setItalic(false);
  }

  return (
    <Card title="Add style" description="Regular, Italic, Bold, or any custom style name.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Style name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bold Italic"
            className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            Weight
          </label>
          <input
            type="number"
            min={100}
            max={900}
            step={100}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink"
          />
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm text-ink">
          <input type="checkbox" checked={italic} onChange={(e) => setItalic(e.target.checked)} className="accent-signal" />
          Italic
        </label>
        <button
          type="button"
          disabled={!name.trim() || add.isPending}
          onClick={submit}
          className="rounded-md border border-ink bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-signal-dim disabled:opacity-40"
        >
          Add style
        </button>
      </div>
    </Card>
  );
}
