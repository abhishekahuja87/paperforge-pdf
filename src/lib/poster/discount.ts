/** Number inside a price the owner typed, such as "Rs. 1,299.50" or "499/-". 0 when there is none. */
export function priceNumber(text: string): number {
  const match = /\d[\d,]*(?:\.\d+)?/.exec(text);
  if (!match) return 0;
  const value = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(value) ? value : 0;
}

/** Whole-number percentage saved, or 0 when the sale price is not lower than the original. */
export function discountPercent(original: string, price: string): number {
  const was = priceNumber(original);
  const now = priceNumber(price);
  if (was <= 0 || now <= 0 || now >= was) return 0;
  return Math.max(1, Math.min(99, Math.round(((was - now) / was) * 100)));
}

/** Biggest saving across the products, for the "UP TO 40% OFF" badge. */
export function bestDiscount(products: { original: string; price: string }[]): number {
  return products.reduce((best, p) => Math.max(best, discountPercent(p.original, p.price)), 0);
}

/** Shows a social handle the way people read it: no web address in front, and @ for Instagram. */
export function cleanHandle(text: string, network: 'facebook' | 'instagram'): string {
  const trimmed = text.trim().replace(/^https?:\/\/(www\.)?(facebook|fb|instagram)\.com\//i, '').replace(/[/?#].*$/, '').trim();
  if (!trimmed) return '';
  return network === 'instagram' && !trimmed.startsWith('@') ? `@${trimmed}` : trimmed;
}
