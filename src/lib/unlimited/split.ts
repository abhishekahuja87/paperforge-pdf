/** Plans how to cut a PDF into parts. Pages are numbered from 1 and ranges include both ends. */
export interface PageRange { from: number; to: number }

export const rangeLabel = (range: PageRange): string => (range.from === range.to ? `page ${range.from}` : `pages ${range.from}-${range.to}`);

/** A new part every `every` pages. */
export function rangesEvery(total: number, every: number): PageRange[] {
  const step = Math.max(1, Math.floor(every));
  const out: PageRange[] = [];
  for (let from = 1; from <= total; from += step) out.push({ from, to: Math.min(total, from + step - 1) });
  return out;
}

/** A new part starts on each listed page (page 1 always starts the first part). Pages to leave out, such as blank separators, are dropped. */
export function rangesFromStarts(total: number, starts: number[], dropPages: ReadonlySet<number> = new Set()): PageRange[] {
  const cuts = [...new Set([1, ...starts.filter((page) => page >= 1 && page <= total)])].sort((a, b) => a - b);
  const out: PageRange[] = [];
  cuts.forEach((from, index) => {
    const to = (cuts[index + 1] ?? total + 1) - 1;
    let start = from; let end = to;
    while (start <= end && dropPages.has(start)) start += 1;
    while (end >= start && dropPages.has(end)) end -= 1;
    if (start <= end) out.push({ from: start, to: end });
  });
  return out;
}

/** Fills each part with pages until the next page would take it over `limit` bytes. A page bigger than the limit gets a part of its own. */
export function rangesBySize(pageBytes: number[], limit: number): PageRange[] {
  const out: PageRange[] = [];
  let from = 1; let used = 0;
  pageBytes.forEach((bytes, index) => {
    const page = index + 1;
    if (page > from && used + bytes > limit) { out.push({ from, to: page - 1 }); from = page; used = 0; }
    used += bytes;
  });
  if (pageBytes.length > 0) out.push({ from, to: pageBytes.length });
  return out;
}
