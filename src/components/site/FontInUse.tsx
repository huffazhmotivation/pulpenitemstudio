import Image from "next/image";
import Link from "next/link";

interface ShowcaseImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  font: { name: string; slug: string };
}

// A repeating editorial rhythm: full-width, then a landscape/portrait pair,
// then a tight three-up — so the grid never looks like a uniform tile wall
// no matter how many images come back from the database.
const LAYOUT = [
  "col-span-12 aspect-[21/9]",
  "col-span-12 aspect-[4/5] sm:col-span-5",
  "col-span-12 aspect-[3/2] sm:col-span-7",
  "col-span-6 aspect-square sm:col-span-4",
  "col-span-6 aspect-square sm:col-span-4",
  "col-span-12 aspect-[16/10] sm:col-span-4",
  "col-span-12 aspect-[3/2] sm:col-span-7",
  "col-span-12 aspect-[4/5] sm:col-span-5",
  "col-span-12 aspect-[21/9]",
];

export function FontInUse({ images }: { images: ShowcaseImage[] }) {
  if (images.length === 0) return null;

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-grid px-6 py-16 md:px-10 md:py-24">
        <div className="section-head mb-10">
          <h2 className="font-display text-3xl text-ink md:text-4xl">Font in use</h2>
          <p className="hidden max-w-xs text-right text-sm text-ink-soft md:block">
            Posters, packaging, branding, and editorial work set in Pulpenitem typefaces.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {images.map((img, i) => (
            <Link
              key={img.id}
              href={`/fonts/${img.font.slug}`}
              className={`group relative overflow-hidden border border-line bg-paper-dim/40 ${
                LAYOUT[i % LAYOUT.length]
              }`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text ?? img.font.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-ink/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-paper transition-transform duration-300 group-hover:translate-y-0">
                <span>{img.font.name}</span>
                <span>View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
