import { formatPrice } from "@/lib/utils";

export interface OrderLine {
  fontName: string;
  licenseName: string;
  price: number;
  currency?: string;
  fontSlug?: string;
}

interface BuildLinkOptions {
  siteUrl?: string;
}

function lineText(line: OrderLine, siteUrl?: string): string[] {
  const out = [
    `Font: ${line.fontName}`,
    `License: ${line.licenseName}`,
    `Price: ${formatPrice(line.price, line.currency)}`,
  ];
  if (line.fontSlug && siteUrl) {
    out.push(`Link: ${siteUrl}/fonts/${line.fontSlug}`);
  }
  return out;
}

function total(lines: OrderLine[]): { amount: number; currency: string } | null {
  if (lines.length === 0) return null;
  const currency = lines[0].currency || "USD";
  const sameCurrency = lines.every((l) => (l.currency || "USD") === currency);
  if (!sameCurrency) return null;
  return { amount: lines.reduce((sum, l) => sum + l.price, 0), currency };
}

/**
 * Builds a wa.me deep link pre-filled with one or more font + license
 * lines, so the studio owner gets a ready-to-confirm order the moment
 * the chat opens. Works for a single quick-order button as well as a
 * full multi-item cart checkout.
 */
export function buildWhatsAppLink(
  whatsappNumber: string,
  lines: OrderLine[],
  options: BuildLinkOptions = {}
): string {
  const digits = whatsappNumber.replace(/[^0-9]/g, "");
  const isMulti = lines.length > 1;
  const message = [
    `Hi Pulpenitem Studio, I'd like to order:`,
    ``,
    ...lines.flatMap((line, i) => [
      ...(isMulti ? [`${i + 1}. ${line.fontName} — ${line.licenseName}`] : lineText(line, options.siteUrl)),
      ...(isMulti && line.fontSlug && options.siteUrl ? [`   Link: ${options.siteUrl}/fonts/${line.fontSlug}`] : []),
      ...(isMulti ? [`   Price: ${formatPrice(line.price, line.currency)}`] : []),
    ]),
  ];
  const t = total(lines);
  if (isMulti && t) {
    message.push(``, `Total: ${formatPrice(t.amount, t.currency)}`);
  }
  const text = encodeURIComponent(message.join("\n"));
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildEmailLink(
  email: string,
  lines: OrderLine[],
  options: BuildLinkOptions = {}
): string {
  const isMulti = lines.length > 1;
  const subject = encodeURIComponent(
    isMulti
      ? `Order: ${lines.length} items`
      : `Order: ${lines[0]?.fontName} — ${lines[0]?.licenseName} License`
  );
  const body = [
    `Hi Pulpenitem Studio,`,
    ``,
    `I'd like to order the following:`,
    ``,
    ...lines.flatMap((line, i) => [
      ...(isMulti ? [`${i + 1}. ${line.fontName} — ${line.licenseName}`] : lineText(line, options.siteUrl)),
      ...(isMulti && line.fontSlug && options.siteUrl ? [`   Link: ${options.siteUrl}/fonts/${line.fontSlug}`] : []),
      ...(isMulti ? [`   Price: ${formatPrice(line.price, line.currency)}`] : []),
    ]),
  ];
  const t = total(lines);
  if (isMulti && t) {
    body.push(``, `Total: ${formatPrice(t.amount, t.currency)}`);
  }
  body.push(``, `Thanks!`);
  return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body.join("\n"))}`;
}
