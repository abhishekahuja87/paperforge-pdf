import React, { useMemo, useState } from 'react';
import { InputGrid, NumberField, SelectField } from '../../finance/ui';
import { checkAll } from '../../../lib/sports/fit';
import { formatLength, toMetres } from '../../../lib/sports/units';
import text from '../../../locales/packs/sports.courts.en.json';

type SportText = { name: string; variants: Record<string, string> };
const sportsText = text.sports as unknown as Record<string, SportText>;
const ui = text.ui;
const MAX_METRES = 1000;

/** Which sports and versions fit in a space the visitor has, with the spare room or the shortfall. */
const CourtFit: React.FC<{ onOpen: (sportId: string, variantId: string) => void }> = ({ onOpen }) => {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState<'m' | 'ft'>('m');
  const [extra, setExtra] = useState('0');

  const space = useMemo(() => {
    const l = toMetres(Number(length), unit);
    const w = toMetres(Number(width), unit);
    const e = toMetres(Number(extra) || 0, unit);
    if (!(l > 0) || !(w > 0) || l > MAX_METRES || w > MAX_METRES || e < 0 || e > 50) return null;
    return { length: l, width: w, extra: e };
  }, [length, width, extra, unit]);

  const results = useMemo(() => (space ? checkAll({ length: space.length, width: space.width }, space.extra) : []), [space]);
  const fitting = results.filter((r) => r.fits).sort((a, b) => b.count - a.count);
  const failing = results.filter((r) => !r.fits).sort((a, b) => Math.min(b.spare[0], b.spare[1]) - Math.min(a.spare[0], a.spare[1]));

  const row = (r: (typeof results)[number], ok: boolean) => {
    const label = `${sportsText[r.sport.id].name}: ${sportsText[r.sport.id].variants[r.variant.id]}`;
    return (
      <li key={`${r.sport.id}-${r.variant.id}`} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-semibold text-slate-900">{label}{ok && r.count > 1 ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800">{r.count} {ui.courts}</span> : null}</p>
          <button type="button" onClick={() => onOpen(r.sport.id, r.variant.id)} className="min-h-9 rounded-lg border border-slate-300 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">{ui.openIt}</button>
        </div>
        <p className="mt-1 text-slate-600">{ui.needs}: {formatLength(r.need[0])} x {formatLength(r.need[1])}</p>
        <p className={ok ? 'text-emerald-700' : 'text-rose-700'}>
          {ok ? `${ui.spare}: ${formatLength(Math.max(r.spare[0], 0))} x ${formatLength(Math.max(r.spare[1], 0))}` : `${ui.short}: ${r.spare[0] < 0 ? formatLength(-r.spare[0]) : '0 m'} x ${r.spare[1] < 0 ? formatLength(-r.spare[1]) : '0 m'}`}
        </p>
      </li>
    );
  };

  return (
    <div>
      <InputGrid>
        <NumberField label={ui.spaceLength} value={length} onChange={setLength} suffix={unit} />
        <NumberField label={ui.spaceWidth} value={width} onChange={setWidth} suffix={unit} />
        <SelectField label={ui.unit} value={unit} onChange={(v) => setUnit(v === 'ft' ? 'ft' : 'm')} options={[{ value: 'm', label: 'Metres' }, { value: 'ft', label: 'Feet' }]} />
        <NumberField label={ui.extra} value={extra} onChange={setExtra} suffix={unit} hint={ui.extraHint} />
      </InputGrid>
      {!space && <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">{ui.enterSpace}</p>}
      {space && (
        <div className="mt-4 space-y-4">
          <section aria-labelledby="court-fits">
            <h3 id="court-fits" className="text-sm font-semibold text-slate-900">{ui.fits} ({fitting.length})</h3>
            {fitting.length === 0 ? <p className="mt-2 text-xs text-slate-600">{ui.nothingFits}</p> : <ul className="mt-2 space-y-2">{fitting.map((r) => row(r, true))}</ul>}
          </section>
          <section aria-labelledby="court-nofit">
            <h3 id="court-nofit" className="text-sm font-semibold text-slate-900">{ui.noFit} ({failing.length})</h3>
            <ul className="mt-2 space-y-2">{failing.map((r) => row(r, false))}</ul>
          </section>
          <p className="text-[11px] text-slate-500">{ui.fitNote}</p>
        </div>
      )}
    </div>
  );
};

export default CourtFit;
