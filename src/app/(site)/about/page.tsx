import { getHomepageSettings, getSiteSettings } from "@/lib/queries";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const [settings, homepage] = await Promise.all([getSiteSettings(), getHomepageSettings()]);

  return (
    <div className="mx-auto max-w-grid px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow-accent mb-4">About</p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
        {homepage.about_heading}
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-ink-soft">{homepage.about_body}</p>

      <div className="relative mt-16 border-t border-line pt-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-2">Studio</p>
            <p className="text-sm text-ink-soft">{settings.studio_name}</p>
          </div>
          <div>
            <p className="eyebrow mb-2">Focus</p>
            <p className="text-sm text-ink-soft">Editorial and display typefaces, drawn in-house.</p>
          </div>
          <div>
            <p className="eyebrow mb-2">Contact</p>
            <p className="text-sm text-ink-soft">
              {settings.contact_email ?? "Get in touch via the contact page."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
