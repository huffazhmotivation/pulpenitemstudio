import { getLicenses } from "@/lib/queries";

export const metadata = { title: "License" };

export default async function LicensePage() {
  const licenses = await getLicenses();

  return (
    <div className="mx-auto max-w-grid px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow-accent mb-4">License</p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
        Usage &amp; licensing
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-soft">
        Every typeface is sold under one or more of the license types below. Exact prices per
        font are shown on each font&apos;s page — order the license that matches how you plan to
        use the typeface.
      </p>

      <div className="mt-14 divide-y divide-line border-t border-line">
        {licenses.map((license) => (
          <div key={license.id} className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[200px_1fr]">
            <h2 className="font-display text-2xl text-ink">{license.name}</h2>
            <p className="text-ink-soft">{license.description ?? "Details available on request."}</p>
          </div>
        ))}
        {licenses.length === 0 && (
          <p className="py-12 text-ink-soft">License types will appear here once configured in Admin.</p>
        )}
      </div>

      <div className="mt-14 border border-line p-6 text-sm text-ink-soft">
        <p>
          Need a custom license — extended print runs, broadcast, or a license type not listed
          here? Reach out via the{" "}
          <a href="/contact" className="underline hover:text-signal">
            contact page
          </a>{" "}
          and we&apos;ll put together a quote.
        </p>
      </div>
    </div>
  );
}
