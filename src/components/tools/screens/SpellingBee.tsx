import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { bool, isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { buildBeeSlides, clampInt, type BeeMode } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { TimedPlayer } from './TimedPlayer';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

interface Saved { rows: FormRow[]; mode: BeeMode; auto: boolean; think: number; reveal: number; shuffle: boolean; light: boolean; logo: string }
const COLUMNS: Column[] = [
  { key: 'word', label: 'Word', placeholder: 'For example library', size: 'mid' },
  { key: 'hint', label: 'Meaning, clue or sentence', placeholder: 'For example a place with many books', size: 'wide' },
  { key: 'image', label: 'Picture clue (optional)', type: 'image', size: 'mid' },
];
const LISTS: Array<Preset & { words: Array<[string, string]> }> = [
  { id: 'animals', label: 'Animals', blurb: '8 animal words for younger classes.', words: [['elephant', 'the biggest land animal, with a trunk'], ['giraffe', 'a tall animal with a long neck'], ['kangaroo', 'an animal that hops and carries its baby in a pouch'], ['butterfly', 'an insect with colourful wings'], ['crocodile', 'a large reptile that lives in rivers'], ['penguin', 'a bird that swims but cannot fly'], ['dolphin', 'a clever animal that lives in the sea'], ['squirrel', 'a small animal that collects nuts']] },
  { id: 'school', label: 'School words', blurb: '8 everyday school words.', words: [['library', 'a place with many books'], ['calendar', 'it shows the days and months of the year'], ['homework', 'work from school that you do at home'], ['dictionary', 'a book that gives the meanings of words'], ['playground', 'where children play at school'], ['notebook', 'a book to write in'], ['teacher', 'a person who teaches in a class'], ['science', 'the study of nature and how things work']] },
  { id: 'tricky', label: 'Tricky spellings', blurb: '8 words many people spell wrongly.', words: [['necessary', 'needed; you must have it'], ['separate', 'to keep apart'], ['definitely', 'without any doubt'], ['receive', 'to get something that is given'], ['environment', 'the world around us'], ['beautiful', 'very pleasing to look at'], ['calendar', 'a chart of the days of the year'], ['occasion', 'a special event or time']] },
];
const read = (value: unknown): Saved | null => (isRecord(value) ? { rows: readRows(value.rows, ['word', 'hint', 'image']) ?? [], mode: oneOf(value.mode, ['spell', 'read'] as const, 'spell'), auto: bool(value.auto, false), think: num(value.think, 15), reveal: num(value.reveal, 6), shuffle: bool(value.shuffle, false), light: bool(value.light, false), logo: str(value.logo) } : null);

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    const held = copy[index] as T;
    copy[index] = copy[other] as T;
    copy[other] = held;
  }
  return copy;
}

export const SpellingBee: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-bee-v1', { rows: [], mode: 'spell', auto: false, think: 15, reveal: 6, shuffle: false, light: false, logo: '' }, read);
  const [active, setActive] = useState<string | null>(null);
  const [slides, setSlides] = useState<ReturnType<typeof buildBeeSlides> | null>(null);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setSlides(null), []);
  const words = useMemo(() => saved.rows.filter((row) => (row.word ?? '').trim()).map((row) => ({ word: row.word ?? '', hint: row.hint ?? '', image: row.image || undefined })), [saved.rows]);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });
  const start = () => setSlides(buildBeeSlides(saved.shuffle ? shuffled(words) : words, saved.mode, saved.auto ? clampInt(saved.think, 3, 600, 15) : 0, saved.auto ? clampInt(saved.reveal, 1, 120, 6) : 0));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={LISTS} active={active} hint="Pick a ready word list, then change, add or remove words." onPick={(id) => { const list = LISTS.find((entry) => entry.id === id); if (!list) return; update({ rows: list.words.map(([word, hint]) => makeRow({ word, hint })) }); setActive(id); scroll(); }} />
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor title="Words" columns={COLUMNS} rows={saved.rows} onChange={(rows) => { update({ rows }); setActive(null); }} blank={{ word: '', hint: '', image: '' }} addLabel="Add a word" empty="No words yet. Pick a list above, add a word, or paste many at once." bulk={{ keys: ['word', 'hint'], hint: 'One word per line: word | meaning or clue. You can also use a tab or " - " between them.', example: 'library | a place with many books\nelephant - the biggest land animal' }} />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">How to play</h2>
        <div role="radiogroup" aria-label="Game type" className="grid gap-2 sm:grid-cols-2">
          {([['spell', 'Spell it', 'The clue shows first. Reveal shows the word and its letters.'], ['read', 'Read it', 'The word shows first. Reveal shows its meaning.']] as const).map(([id, label, blurb]) => (
            <label key={id} className={`cursor-pointer rounded-xl border p-3 transition ${saved.mode === id ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-300'}`}>
              <input type="radio" name="bee-mode" value={id} checked={saved.mode === id} onChange={() => update({ mode: id })} className="sr-only" />
              <span className="block text-sm font-bold text-stone-900">{label}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-stone-600">{blurb}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.auto} onChange={(event) => update({ auto: event.target.checked })} className="h-4 w-4 accent-orange-700" />Move on by itself (otherwise you click)</label>
          <label className={CHECK}><input type="checkbox" checked={saved.shuffle} onChange={(event) => update({ shuffle: event.target.checked })} className="h-4 w-4 accent-orange-700" />Shuffle the words</label>
          <label className={CHECK}><input type="checkbox" checked={saved.light} onChange={(event) => update({ light: event.target.checked })} className="h-4 w-4 accent-orange-700" />Light screen</label>
        </div>
        {saved.auto && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>Seconds to think<input type="number" inputMode="numeric" min={3} max={600} value={saved.think} onChange={(event) => update({ think: Number(event.target.value) })} className={FIELD} /></label>
            <label className={LABEL}>Seconds to show the answer<input type="number" inputMode="numeric" min={1} max={120} value={saved.reveal} onChange={(event) => update({ reveal: Number(event.target.value) })} className={FIELD} /></label>
          </div>
        )}
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} label="Logo in the corner (optional, for example your school)" />
        <p className="text-sm font-semibold text-stone-800">{words.length === 0 ? 'Add some words to start.' : `${words.length} ${words.length === 1 ? 'word' : 'words'}, ${saved.auto ? 'moves on by itself' : 'moves when you click'}.`}</p>
        <button type="button" onClick={start} disabled={words.length === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start the bee</button>
        <Note>Your word list is saved only in this browser. Click, press space or the right arrow to reveal and move on; the left arrow goes back. Escape or Close leaves.</Note>
      </section>
      {slides && <TimedPlayer slides={slides} label="Spelling and vocabulary bee" showTimer={saved.auto} sound={false} light={saved.light} logo={saved.logo || undefined} onClose={close} />}
    </div>
  );
};

export default SpellingBee;
