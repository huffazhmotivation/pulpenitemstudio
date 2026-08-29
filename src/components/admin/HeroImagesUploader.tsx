"use client";

import { useRef } from "react";
import { addHeroImages } from "@/lib/actions/settings";
import { compressImagesForUpload } from "@/lib/image-compress";
import { Button } from "@/components/ui/Button";
import { SavedIndicator } from "@/components/admin/Toast";
import { useSavedAction } from "@/components/admin/font-editor/useSavedAction";

/**
 * Same multi-file "Add" control as before, but files are resized +
 * compressed in the browser before they're sent to the addHeroImages
 * server action, instead of uploading originals straight off a
 * camera/phone.
 */
export function HeroImagesUploader() {
  const upload = useSavedAction();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length === 0) return;

    upload.run(
      async () => {
        const compressed = await compressImagesForUpload(files);
        const fd = new FormData();
        compressed.forEach((f) => fd.append("hero_images", f));
        await addHeroImages(fd);
        if (inputRef.current) inputRef.current.value = "";
      },
      {
        successMessage:
          files.length > 1 ? `${files.length} hero images added.` : "Hero image added.",
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        ref={inputRef}
        name="hero_images"
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        disabled={upload.isPending}
        className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-panel-2"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={upload.isPending}>
        {upload.isPending ? "Adding…" : "Add"}
      </Button>
      <SavedIndicator state={upload.state} />
    </form>
  );
}
