"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  deleteFontImage,
  moveFontImage,
  setFontImageAsCover,
  updateFontImageAlt,
  uploadCoverImage,
  uploadFontImage,
} from "@/lib/actions/fonts";
import { MAX_GALLERY_IMAGES } from "@/lib/utils";
import { compressImageForUpload } from "@/lib/image-compress";
import type { FontImage } from "@/lib/types/database";
import { Card, EmptyState, dashedUpload } from "./fields";
import { SavedIndicator } from "@/components/admin/Toast";
import { useSavedAction } from "./useSavedAction";

export function GalleryTab({
  fontId,
  images,
  coverImageUrl,
}: {
  fontId: string;
  images: FontImage[];
  coverImageUrl: string | null;
}) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const atCap = sorted.length >= MAX_GALLERY_IMAGES;
  const cover = useSavedAction();
  const upload = useSavedAction();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    cover.run(
      async () => {
        const compressed = await compressImageForUpload(file);
        const fd = new FormData();
        fd.set("file", compressed);
        await uploadCoverImage(fontId, fd);
      },
      { successMessage: "Cover image updated." }
    );
    e.target.value = "";
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    upload.run(
      async () => {
        for (const file of files) {
          const compressed = await compressImageForUpload(file);
          const fd = new FormData();
          fd.set("file", compressed);
          fd.set("alt_text", "");
          await uploadFontImage(fontId, fd);
        }
      },
      {
        successMessage:
          files.length > 1 ? `${files.length} images added to gallery.` : "Image added to gallery.",
      }
    );
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <Card
        title="Cover image"
        description="Shown on product cards, category tiles, and homepage sections."
        action={<SavedIndicator state={cover.state} />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {coverImageUrl ? (
            <div className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden rounded-md border border-line">
              <Image src={coverImageUrl} alt="Cover" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-48 shrink-0 items-center justify-center rounded-md border border-dashed border-line text-center text-[11px] font-medium uppercase tracking-[0.04em] text-ink-soft">
              No cover yet
            </div>
          )}
          <div className="flex-1">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className={dashedUpload}
              onChange={handleCoverChange}
              disabled={cover.isPending}
            />
            <p className="mt-2 text-[11px] text-ink-soft">
              Uploads instantly and replaces the current cover. You can also promote any gallery
              image below. Large photos are automatically resized and compressed in your browser
              before upload, so there&apos;s no need to shrink them yourself first.
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Gallery & specimen images"
        description={`Up to ${MAX_GALLERY_IMAGES} images shown on the font's detail page, in this order. Select multiple files at once to add several — each is automatically resized and compressed before upload.`}
        action={
          <span className="flex items-center gap-3">
            <SavedIndicator state={upload.state} />
            <span className="text-xs text-ink-soft">
              {sorted.length} / {MAX_GALLERY_IMAGES}
            </span>
          </span>
        }
      >
        {sorted.length === 0 ? (
          <EmptyState>No gallery images yet — add the first one below.</EmptyState>
        ) : (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sorted.map((img, i) => (
              <GalleryImageRow
                key={img.id}
                fontId={fontId}
                image={img}
                index={i}
                isCover={img.image_url === coverImageUrl}
                isFirst={i === 0}
                isLast={i === sorted.length - 1}
              />
            ))}
          </div>
        )}

        {atCap ? (
          <p className="rounded-md border border-dashed border-line bg-paper/60 p-5 text-sm text-ink-soft">
            Gallery is full ({MAX_GALLERY_IMAGES}/{MAX_GALLERY_IMAGES}). Remove an image to add
            another.
          </p>
        ) : (
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className={dashedUpload}
            onChange={handleGalleryChange}
            disabled={upload.isPending}
          />
        )}
      </Card>
    </div>
  );
}

function GalleryImageRow({
  fontId,
  image,
  index,
  isCover,
  isFirst,
  isLast,
}: {
  fontId: string;
  image: FontImage;
  index: number;
  isCover: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const alt = useSavedAction();
  const move = useSavedAction();
  const cover = useSavedAction();
  const remove = useSavedAction();

  return (
    <div className="rounded-md border border-line bg-paper/40 p-3">
      <div className="flex gap-3">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-md border border-line">
          <Image src={image.image_url} alt={image.alt_text ?? ""} fill className="object-cover" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            #{index + 1}
            {isCover && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-paper">Cover</span>}
            <SavedIndicator state={alt.state === "saving" || alt.state === "error" ? alt.state : "idle"} />
          </p>
          <input
            defaultValue={image.alt_text ?? ""}
            placeholder="Alt text"
            onBlur={(e) =>
              alt.run(() => {
                const fd = new FormData();
                fd.set("alt_text", e.target.value);
                return updateFontImageAlt(fontId, image.id, fd);
              })
            }
            className="w-full rounded-sm border border-line bg-paper px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-ink"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              disabled={isFirst || move.isPending}
              onClick={() => move.run(() => moveFontImage(fontId, image.id, "up"))}
              className="font-semibold text-ink-soft hover:text-ink disabled:opacity-30"
            >
              ↑ Up
            </button>
            <button
              type="button"
              disabled={isLast || move.isPending}
              onClick={() => move.run(() => moveFontImage(fontId, image.id, "down"))}
              className="font-semibold text-ink-soft hover:text-ink disabled:opacity-30"
            >
              ↓ Down
            </button>
            <button
              type="button"
              disabled={isCover || cover.isPending}
              onClick={() =>
                cover.run(() => setFontImageAsCover(fontId, image.id), {
                  successMessage: "Set as cover image.",
                })
              }
              className="font-semibold text-ink-soft hover:text-ink disabled:opacity-30"
            >
              Set as cover
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                remove.run(() => deleteFontImage(fontId, image.id), { successMessage: "Image removed." })
              }
              className="font-semibold text-sale hover:opacity-70"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
