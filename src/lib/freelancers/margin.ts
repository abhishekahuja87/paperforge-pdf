/** Margin, markup, discount and break-even maths. Margin is profit as a share of price; markup is profit as a share of cost. */

export const marginOf = (cost: number, price: number) => (price > 0 ? ((price - cost) / price) * 100 : NaN);
export const markupOf = (cost: number, price: number) => (cost > 0 ? ((price - cost) / cost) * 100 : NaN);
/** Price that gives the margin wanted (margin must be below 100). */
export const priceForMargin = (cost: number, marginPercent: number) => (marginPercent < 100 ? cost / (1 - marginPercent / 100) : NaN);
export const priceForMarkup = (cost: number, markupPercent: number) => cost * (1 + markupPercent / 100);
/** Markup that equals a given margin, and the reverse. */
export const markupFromMargin = (marginPercent: number) => (marginPercent < 100 ? (marginPercent / (100 - marginPercent)) * 100 : NaN);
export const marginFromMarkup = (markupPercent: number) => (markupPercent / (100 + markupPercent)) * 100;

export interface DiscountImpact {
  newPrice: number;
  newProfit: number;
  newMargin: number;
  /** Extra sales (in %) needed to earn the same total profit as before. null if the discount removes all profit. */
  extraSalesNeeded: number | null;
}

export function discountImpact(cost: number, price: number, discountPercent: number): DiscountImpact | null {
  if (![cost, price, discountPercent].every(Number.isFinite) || price <= 0 || cost < 0 || discountPercent < 0 || discountPercent >= 100) return null;
  const newPrice = price * (1 - discountPercent / 100);
  const newProfit = newPrice - cost;
  const oldProfit = price - cost;
  const extraSalesNeeded = newProfit > 0 && oldProfit > 0 ? (oldProfit / newProfit - 1) * 100 : null;
  return { newPrice, newProfit, newMargin: marginOf(cost, newPrice), extraSalesNeeded };
}

/** Units (or hours, or clients) to sell to cover fixed costs. null when each sale makes no profit. */
export function breakEvenUnits(fixedCosts: number, price: number, variableCost: number): number | null {
  const each = price - variableCost;
  if (![fixedCosts, price, variableCost].every(Number.isFinite) || fixedCosts < 0 || each <= 0) return null;
  return Math.ceil(fixedCosts / each);
}
