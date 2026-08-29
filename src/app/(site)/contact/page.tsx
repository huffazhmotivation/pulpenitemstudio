import { ButtonLink } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/queries";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-grid px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow-accent mb-4">Contact</p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
        Let&apos;s talk type.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-soft">
        For orders, custom licensing, or general questions, reach {settings.studio_name} directly —
        no forms, no tickets.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:max-w-xl">
        {settings.whatsapp_number && (
          <ButtonLink
            href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`}
            variant="signal"
            size="lg"
            className="w-full"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </ButtonLink>
        )}
        {settings.contact_email && (
          <ButtonLink href={`mailto:${settings.contact_email}`} variant="secondary" size="lg" className="w-full">
            Email
          </ButtonLink>
        )}
      </div>

      <div className="mt-16 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
        {settings.contact_email && (
          <div>
            <p className="eyebrow mb-2">Email</p>
            <p className="text-sm text-ink">{settings.contact_email}</p>
          </div>
        )}
        {settings.instagram_handle && (
          <div>
            <p className="eyebrow mb-2">Instagram</p>
            <p className="text-sm text-ink">@{settings.instagram_handle}</p>
          </div>
        )}
        {settings.address && (
          <div>
            <p className="eyebrow mb-2">Studio</p>
            <p className="text-sm text-ink">{settings.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
