import { randomInt } from '../toolkit/pick';

/** Lucky draw logic: a pool of tickets, drawn one at a time without repeats. */
export const MAX_TICKETS = 5000;

export interface TicketRange { from: number; to: number; prefix: string; digits: number }

export function rangeTickets(range: TicketRange): string[] {
  const from = Math.floor(range.from);
  const to = Math.floor(range.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];
  const digits = Math.max(0, Math.min(8, Math.floor(range.digits)));
  const out: string[] = [];
  for (let value = from; value <= to && out.length < MAX_TICKETS; value += 1) out.push(`${range.prefix}${digits > 0 ? String(value).padStart(digits, '0') : String(value)}`);
  return out;
}

/** Takes one ticket out of the pool. Returns the winner and the pool that is left. */
export function drawOne(pool: readonly string[]): { winner: string; rest: string[] } | null {
  if (pool.length === 0) return null;
  const index = randomInt(pool.length);
  return { winner: pool[index]!, rest: pool.filter((_, position) => position !== index) };
}

/** Lines such as "Mixer grinder" into prizes, one per line. */
export function parsePrizes(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 200);
}
