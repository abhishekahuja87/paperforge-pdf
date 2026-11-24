import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { THEMES, buildNoticeSlides, clampInt, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { TimedPlayer } from './TimedPlayer';
import { FIELD, LABEL, ORANGE } from './ui';

interface Saved { rows: FormRow[]; seconds: number; logo: string }
const COLUMNS: Column[] = [
  { key: 'title', label: 'Heading', placeholder: 'For example Happy Birthday, Riya!', size: 'wide' },
  { key: 'theme', label: 'Colour', type: 'select', options: THEMES.map((entry) => [entry.id, entry.label] as [string, string]), size: 'narrow' },
  { key: 'text', label: 'Message (optional)', type: 'area', placeholder: 'A line or two', size: 'wide' },
  { key: 'image', label: 'Picture (optional)', type: 'image', size: 'mid' },
  { key: 'video', label: 'Video (optional)', type: 'video', size: 'mid' },
];
const note = (title: string, text: string, theme: Theme) => ({ title, text, theme, image: '' });
const BOARDS: Array<Preset & { notices: Array<{ title: string; text: string; theme: Theme; image: string }> }> = [
  { id: 'welcome', label: 'Welcome board', blurb: 'A welcome, today’s timings and a thank you.', notices: [
    note('Welcome!', 'We are glad you are here.', 'orange'), note('Today’s timings', 'Open 9 AM to 6 PM. Lunch break 1 PM to 2 PM.', 'blue'), note('Please keep the place clean', 'Thank you for your help.', 'green')] },
  { id: 'birthdays', label: 'Birthdays and wishes', blurb: 'Birthday and anniversary greetings.', notices: [
    note('Happy Birthday, Name!', 'Wishing you a wonderful year ahead.', 'rose'), note('Happy Anniversary, Names!', 'Congratulations from all of us.', 'orange')] },
  { id: 'notices', label: 'Notices', blurb: 'Meeting, holiday and reminder notices.', notices: [
    note('Meeting today', 'Team meeting at 4 PM in the main hall.', 'blue'), note('Holiday notice', 'We will be closed on the date you choose. We reopen the next day.', 'dark'), note('Reminder', 'Please submit your forms by the end of the week.', 'green')] },
];
const read = (value: unknown): Saved | null => (isRecord(value) ? { rows: readRows(value.rows, ['title', 'text', 'theme', 'image', 'video']) ?? [], seconds: num(value.seconds, 8), logo: str(value.logo) } : null);

export const NoticeBoard: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-notices-v1', { rows: [], seconds: 8, logo: '' }, read);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setPlaying(false), []);
  const notices = useMemo(() => saved.rows.filter((row) => (row.title ?? '').trim()).map((row) => ({ title: row.title ?? '', text: row.text ?? '', image: row.image ?? '', video: row.video ?? '', theme: oneOf(row.theme, THEMES.map((entry) => entry.id), 'dark') })), [saved.rows]);
  const slides = useMemo(() => buildNoticeSlides(notices, clampInt(saved.seconds, 3, 300, 8)), [notices, saved.seconds]);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={BOARDS} active={active} hint="Pick a sample, then replace the words with your own." onPick={(id) => { const board = BOARDS.find((entry) => entry.id === id); if (!board) return; update({ rows: board.notices.map(makeRow) }); setActive(id); scroll(); }} onClear={() => { setSaved({ ...saved, rows: [] }); setActive(null); }} clearLabel="Clear the notices and start again" />
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor title="Messages" columns={COLUMNS} rows={saved.rows} onChange={(rows) => { update({ rows }); setActive(null); }} blank={{ title: '', text: '', theme: 'orange', image: '', video: '' }} addLabel="Add a message" empty="No messages yet. Pick a sample above or add your own." />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <label className={`${LABEL} max-w-xs`}>Seconds on each message<input type="number" inputMode="numeric" min={3} max={300} value={saved.seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className={FIELD} /></label>
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} label="Logo in the corner (optional)" />
        <p className="text-sm font-semibold text-stone-800">{notices.length === 0 ? 'Add some messages to start.' : `${notices.length} ${notices.length === 1 ? 'message' : 'messages'}, about ${notices.length * clampInt(saved.seconds, 3, 300, 8)} seconds for one round. It keeps looping.`}</p>
        <button type="button" onClick={() => setPlaying(true)} disabled={notices.length === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Show on screen</button>
        <Note>Open this page on the screen and tap Show on screen. The messages loop until you close it. Your messages and pictures are saved only in this browser (if it is full, pictures may not be kept). A video plays muted and looping during its message, comes from your device and is not uploaded, but it is not kept when you reload the page, so add it again next time. Keep videos short.</Note>
      </section>
      {playing && <TimedPlayer slides={slides} label="Notice and greeting board" loop showTimer={false} sound={false} theme="dark" logo={saved.logo || undefined} onClose={close} />}
    </div>
  );
};

export default NoticeBoard;
