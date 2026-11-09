import React, { useMemo } from 'react';
import type { Item, Sheet } from '../../../lib/paper/geometry';

/** Groups items with the same look into one path each, so thousands of dots stay a handful of elements. */
function groupPaths(items: Item[]): { key: string; d: string; kind: 'line' | 'dot' | 'ring'; color: string; width: number; dash?: [number, number] }[] {
  const groups = new Map<string, { key: string; d: string; kind: 'line' | 'dot' | 'ring'; color: string; width: number; dash?: [number, number] }>();
  const add = (key: string, kind: 'line' | 'dot' | 'ring', color: string, width: number, dash: [number, number] | undefined, segment: string) => {
    const group = groups.get(key);
    if (group) group.d += segment;
    else groups.set(key, { key, d: segment, kind, color, width, dash });
  };
  for (const item of items) {
    if (item.t === 'line') add(`l|${item.c}|${item.w}|${item.dash?.join(',') ?? ''}`, 'line', item.c, item.w, item.dash, `M${item.x1} ${item.y1}L${item.x2} ${item.y2}`);
    else if (item.t === 'dot') add(`d|${item.c}|${item.r}`, 'dot', item.c, item.r, undefined, `M${item.x - item.r} ${item.y}a${item.r} ${item.r} 0 1 0 ${item.r * 2} 0a${item.r} ${item.r} 0 1 0 ${-item.r * 2} 0`);
    else if (item.t === 'ring') add(`r|${item.c}|${item.w}|${item.r}`, 'ring', item.c, item.w, undefined, `M${item.x - item.r} ${item.y}a${item.r} ${item.r} 0 1 0 ${item.r * 2} 0a${item.r} ${item.r} 0 1 0 ${-item.r * 2} 0`);
  }
  return [...groups.values()];
}

interface Props { sheet: Sheet; pageLabel: string | null; id: string }

/** Live preview: the page drawn in millimetres, so what you see is what the PDF contains. */
export const SheetPreview: React.FC<Props> = ({ sheet, pageLabel, id }) => {
  const paths = useMemo(() => groupPaths(sheet.fixed), [sheet.fixed]);
  const texts = sheet.fixed.filter((item): item is Extract<Item, { t: 'text' }> => item.t === 'text');
  const number = sheet.pageNumber;
  return (
    <svg id={id} role="img" aria-label="Preview of the paper" viewBox={`0 0 ${sheet.width} ${sheet.height}`} className="block h-auto max-h-[46vh] w-full bg-white lg:max-h-[78vh]" style={{ aspectRatio: `${sheet.width} / ${sheet.height}` }}>
      <rect width={sheet.width} height={sheet.height} fill="#ffffff" />
      {paths.map((group) => (
        group.kind === 'line' ? (
          <path key={group.key} d={group.d} stroke={group.color} strokeWidth={group.width} strokeLinecap="butt" strokeDasharray={group.dash?.join(' ')} fill="none" />
        ) : group.kind === 'dot' ? (
          <path key={group.key} d={group.d} fill={group.color} />
        ) : (
          <path key={group.key} d={group.d} stroke={group.color} strokeWidth={group.width} fill="none" />
        )
      ))}
      {texts.map((item, index) => (
        <text key={index} x={item.x} y={item.y} fontSize={item.size * 0.3528} fill={item.c} fontWeight={item.bold ? 700 : 400} textAnchor={item.anchor ?? 'start'} fontFamily="Helvetica, Arial, sans-serif">{item.text}</text>
      ))}
      {number && pageLabel && <text x={number.x} y={number.y} fontSize={number.size * 0.3528} fill={number.c} textAnchor={number.anchor} fontFamily="Helvetica, Arial, sans-serif">{pageLabel}</text>}
    </svg>
  );
};
