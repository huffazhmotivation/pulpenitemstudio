import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartProvider } from "@/lib/cart/CartContext";
import { getGameFonts, getSiteSettings } from "@/lib/queries";
import { BUCKETS, publicStorageUrl } from "@/lib/storage";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, gameRows] = await Promise.all([getSiteSettings(), getGameFonts()]);
  const gameFonts = gameRows.map((g) => ({
    name: g.name,
    woff2Url: publicStorageUrl(BUCKETS.previews, g.woff2Path),
  }));
  return (
    <CartProvider>
      <Header settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} gameFonts={gameFonts} />
    </CartProvider>
  );
}
