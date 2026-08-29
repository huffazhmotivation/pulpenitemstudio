import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types/database";

interface CategoryWithPreview extends Category {
  fontCount: number;
  previewImage: string | null;
}

export function CategoryGrid({ categories }: { categories: CategoryWithPreview[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/fonts?category=${cat.slug}`}
          className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-lg border border-line bg-paper-dim"
        >
          {cat.previewImage ? (
            <Image
              src={cat.previewImage}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-4xl font-semibold text-ink-faint">
                {cat.name.slice(0, 2)}
              </span>
            </div>
          )}
          <div className="relative z-10 flex items-end justify-between gap-2 bg-ink/65 px-4 py-3.5">
            <span className="font-display text-sm font-semibold text-white">{cat.name}</span>
            <span className="text-xs text-white/80">{cat.fontCount}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
