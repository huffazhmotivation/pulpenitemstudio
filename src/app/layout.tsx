import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/queries";

// One clean sans for the whole interface. The typefaces themselves are the
// only loud thing on the page.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: `${settings.studio_name} — Premium Fonts & Typefaces`,
      template: `%s — ${settings.studio_name}`,
    },
    description: settings.studio_tagline ?? "A modern, independent type foundry.",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="flex min-h-screen flex-col bg-paper">{children}</body>
    </html>
  );
}
