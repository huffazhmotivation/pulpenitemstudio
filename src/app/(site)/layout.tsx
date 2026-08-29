import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ClickEffects } from "@/components/site/ClickEffects";
import { CartProvider } from "@/lib/cart/CartContext";
import { getSiteSettings } from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <CartProvider>
      <ClickEffects />
      <Header settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
