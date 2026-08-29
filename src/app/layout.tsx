import type { Metadata } from "next";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/queries";

// Manrope for headings/display, Inter for body copy and UI chrome,
// Space Grotesk for compact labels, prices, and license codes — a
// geometric, slightly technical sans that keeps the minimal-futuristic
// accent without reading as a monospace/terminal typeface.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
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
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper">{children}</body>
    </html>
  );
}
