import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { THEMES, buildMenuSlides, clampInt, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { ThemePicker } from '../shared/ThemePicker';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { TimedPlayer } from './TimedPlayer';
import { FIELD, LABEL, ORANGE } from './ui';

interface Saved { shop: string; rows: FormRow[]; perPage: number; seconds: number; currency: string; theme: Theme; logo: string }
const COLUMNS: Column[] = [
  { key: 'section', label: 'Section', placeholder: 'For example Tea', size: 'mid' },
  { key: 'name', label: 'Item', placeholder: 'For example Masala chai', size: 'wide' },
  { key: 'price', label: 'Price', placeholder: '20', size: 'narrow' },
  { key: 'note', label: 'Note (optional)', placeholder: 'For example Fresh', size: 'mid' },
  { key: 'image', label: 'Picture (optional)', type: 'image', size: 'mid' },
];
const item = (section: string, name: string, price: string, note = '') => ({ section, name, price, note });
const MENUS: Array<Preset & { shop: string; items: Array<{ section: string; name: string; price: string; note: string }> }> = [
  { id: 'cafe', label: 'Cafe menu', blurb: 'Hot drinks, cold drinks and snacks.', shop: 'Our Cafe', items: [
    item('Hot drinks', 'Masala chai', '20'), item('Hot drinks', 'Filter coffee', '30'), item('Hot drinks', 'Hot chocolate', '60'),
    item('Cold drinks', 'Cold coffee', '70'), item('Cold drinks', 'Lemon soda', '40'), item('Cold drinks', 'Mango shake', '80'),
    item('Snacks', 'Samosa', '15', 'Served hot'), item('Snacks', 'Veg sandwich', '50'), item('Snacks', 'French fries', '60')] },
  { id: 'specials', label: 'Daily specials', blurb: 'Today’s dishes with a note on each.', shop: 'Today’s specials', items: [
    item('', 'Thali of the day', '120', 'Rice, dal, two sabzis, roti'), item('', 'Paneer wrap', '90', 'With mint chutney'), item('', 'Fresh fruit bowl', '70'), item('', 'Sweet of the day', '30', 'Ask at the counter')] },
  { id: 'price-list', label: 'Price list', blurb: 'A simple services or products list.', shop: 'Price list', items: [
    item('', 'Item one', '100'), item('', 'Item two', '150'), item('', 'Item three', '200'), item('', 'Item four', '250')] },
];
const CURRENCIES: Array<[string, string]> = [['', 'No symbol'], ['₹', '₹ rupee'], ['$', '$ dollar'], ['€', '€ euro'], ['£', '£ pound']];
const read = (value: unknown): Saved | null => (isRecord(value) ? { shop: str(value.shop, 'Our Menu'), rows: readRows(value.rows, ['section', 'name', 'price', 'note', 'image']) ?? [], perPage: num(value.perPage, 6), seconds: num(value.seconds, 10), currency: str(value.currency, '₹'), theme: oneOf(value.theme, THEMES.map((entry) => entry.id), 'dark'), logo: str(value.logo) } : null);

export const MenuBoard: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-menu-v1', { shop: 'Our Menu', rows: [], perPage: 6, seconds: 10, currency: '₹', theme: 'dark', logo: '' }, read);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setPlaying(false), []);
  const items = useMemo(() => saved.rows.filter((row) => (row.name ?? '').trim()).map((row) => ({ section: row.section ?? '', name: row.name ?? '', price: /^\d/.test((row.price ?? '').trim()) ? `${saved.currency}${(row.price ?? '').trim()}` : (row.price ?? ''), note: row.note ?? '', image: row.image ?? '' })), [saved.rows, saved.currency]);
  const slides = useMemo(() => buildMenuSlides(items, saved.shop, clampInt(saved.perPage, 2, 12, 6), clampInt(saved.seconds, 3, 300, 10)).map((slide) => ({ ...slide, theme: saved.theme })), [items, saved.shop, saved.perPage, saved.seconds, saved.theme]);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={MENUS} active={active} hint="Pick a sample, then replace the names and prices with your own." onPick={(id) => { const menu = MENUS.find((entry) => entry.id === id); if (!menu) return; update({ shop: menu.shop, rows: menu.items.map(makeRow) }); setActive(id); scroll(); }} onClear={() => { setSaved({ ...saved, shop: 'Our Menu', rows: [] }); setActive(null); }} clearLabel="Clear the items and start again" />
        <label className={LABEL}>Shop or board name<input type="text" value={saved.shop} onChange={(event) => update({ shop: event.target.value })} className={FIELD} /></label>
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor title="Items" columns={COLUMNS} rows={saved.rows} onChange={(rows) => { update({ rows }); setActive(null); }} blank={{ section: '', name: '', price: '', note: '', image: '' }} addLabel="Add an item" empty="No items yet. Pick a sample above, add an item, or paste many at once." bulk={{ keys: ['name', 'price', 'note'], hint: 'One item per line: name | price | note. Items you paste go in no section, so set the Section afterwards if you use sections.', example: 'Masala chai | 20\nSamosa | 15 | Served hot' }} />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Items on each screen
            <select value={saved.perPage} onChange={(event) => update({ perPage: Number(event.target.value) })} className={FIELD}>{[3, 4, 5, 6, 8, 10].map((count) => <option key={count} value={count}>{count}</option>)}</select>
          </label>
          <label className={LABEL}>Seconds on each screen<input type="number" inputMode="numeric" min={3} max={300} value={saved.seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className={FIELD} /></label>
          <label className={LABEL}>Put this before prices that are only numbers
            <select value={saved.currency} onChange={(event) => update({ currency: event.target.value })} className={FIELD}>{CURRENCIES.map(([value, label]) => <option key={label} value={value}>{label}</option>)}</select>
          </label>
        </div>
        <ThemePicker name="menu-theme" value={saved.theme} onChange={(theme) => update({ theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} label="Shop logo in the corner (optional)" />
        <p className="text-sm font-semibold text-stone-800">{items.length === 0 ? 'Add some items to start.' : `${items.length} ${items.length === 1 ? 'item' : 'items'} on ${slides.length} ${slides.length === 1 ? 'screen' : 'screens'}, about ${slides.length * clampInt(saved.seconds, 3, 300, 10)} seconds for one round. It keeps looping.`}</p>
        <button type="button" onClick={() => setPlaying(true)} disabled={items.length === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Show on screen</button>
        <Note>Open this page on the screen by your counter and tap Show on screen. The board loops until you close it. Your menu is saved only in this browser. Prices are shown exactly as typed, so check them before you show the board. Pictures are shrunk in your browser and kept on this device.</Note>
      </section>
      {playing && <TimedPlayer slides={slides} label="Menu and price board" loop showTimer={false} sound={false} theme={saved.theme} logo={saved.logo || undefined} onClose={close} />}
    </div>
  );
};

export default MenuBoard;
