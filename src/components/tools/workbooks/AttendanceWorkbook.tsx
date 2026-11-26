import React, { useDeferredValue, useMemo, useState } from 'react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { TableInput, type TableValue } from '../shared/TableInput';
import { buildAttendance, SAMPLE_PEOPLE, type Holiday, type Person } from '../../../lib/workbooks/attendance';
import { parseDate } from '../../../lib/workbooks/dates';
import { labels } from '../../../lib/workbooks/common';
import ui from '../../../locales/packs/workbooks.ui.en.json';
import ex from '../../../locales/packs/workbooks.examples.en.json';
import { BookPreview, ContentPanel, FilePanel, NumberField, RegionPanel, TextField, inputClass, usePersisted, useRegion } from './shared';

type StarterId = keyof typeof ex.attendance.starters;
const STARTERS = Object.keys(ex.attendance.starters) as StarterId[];
interface Saved { starter: StarterId; org: string; month: number; year: number; months: number; spare: number; holidays: string; minPercent: number; sample: boolean; hinglish: boolean }
const now = new Date();
const DEFAULTS: Saved = { starter: 'office', org: '', month: now.getMonth() + 1, year: now.getFullYear(), months: 3, spare: 10, holidays: '', minPercent: 75, sample: false, hinglish: false };
const MAX_PEOPLE = 200;
const t = ui.attendance;
const FIELDS = [
  { key: 'name', label: t.fieldName, aliases: ['employee', 'employee name', 'staff', 'student', 'worker', 'full name'], required: true },
  { key: 'id', label: t.fieldId, aliases: ['employee id', 'emp id', 'code', 'roll', 'roll no', 'number'] },
];

/** Attendance and leave register Excel maker: a sheet for each month that shades weekends and holidays. Runs in the browser. */
export const AttendanceWorkbook: React.FC = () => {
  const [saved, change, reset] = usePersisted<Saved>('mdu_wb_attendance_v1', DEFAULTS);
  const [region, setPreset, patchRegion] = useRegion();
  const [table, setTable] = useState<TableValue | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const starter = ex.attendance.starters[saved.starter] ?? ex.attendance.starters.office;
  const order = region.date.startsWith('mm') ? 'mdy' : 'dmy';

  const people = useMemo<Person[]>(() => {
    if (!table) return [];
    const m = table.mapping, cell = (r: string[], key: string) => (m[key] !== undefined && m[key]! >= 0 ? (r[m[key]!] ?? '').trim() : '');
    return table.rows.map((r) => ({ name: cell(r, 'name'), id: cell(r, 'id') })).filter((p) => p.name);
  }, [table]);
  const holidays = useMemo(() => {
    const out: Holiday[] = []; let bad = 0;
    for (const line of saved.holidays.split(/\r?\n/)) {
      if (!line.trim()) continue; const m = /^\s*(\S+)\s*(.*)$/.exec(line)!; const date = parseDate(m[1]!, order);
      if (date === null) bad += 1; else out.push({ date, name: m[2]!.trim() });
    }
    return { list: out.slice(0, 40), bad };
  }, [saved.holidays, order]);

  const useList = people.length > 0;
  const make = (forceSample: boolean) => {
    const sample = !useList && (saved.sample || forceSample);
    return buildAttendance({ org: saved.org, people: useList ? people.slice(0, MAX_PEOPLE) : sample ? SAMPLE_PEOPLE : [], year: saved.year, month: saved.month, months: saved.months, spareRows: saved.spare, weekOff: region.weekOff, holidays: holidays.list, minPercent: saved.minPercent, sample, region, hinglish: saved.hinglish });
  };
  const deferred = useDeferredValue({ saved, region, people, holidays, forceSample: !useList && !saved.sample });
  const previewBook = useMemo(() => make(deferred.forceSample), [deferred.saved, deferred.region, deferred.people, deferred.holidays]); // eslint-disable-line react-hooks/exhaustive-deps
  const version = JSON.stringify([saved, region, people.length, people[0]?.name, holidays.list.length]);
  const startAgain = () => { reset(); setTable(null); setResetKey((k) => k + 1); };
  const applyStarter = (id: StarterId) => { const s = ex.attendance.starters[id]; patchRegion({ weekOff: s.weekOff }); change({ starter: id, months: s.months }); };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.starters}</p>
          <ChoiceButtons label={t.starters} value={saved.starter} onChange={(v) => applyStarter(v as StarterId)} options={STARTERS.map((id) => ({ value: id, label: ex.attendance.starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{starter.hint}</p></div>
        <TextField label={t.org} value={saved.org} onChange={(v) => change({ org: v })} placeholder={t.orgPlaceholder} max={70} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">{t.firstMonth}
            <select value={saved.month} onChange={(e) => change({ month: Number(e.target.value) })} className={inputClass}>{labels.common.months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
          <NumberField label={t.year} value={saved.year} onChange={(v) => change({ year: v })} min={2000} max={2100} />
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.months}</p>
            <ChoiceButtons label={t.months} value={String(saved.months)} onChange={(v) => change({ months: Number(v) })} options={[1, 3, 6, 12].map((n) => ({ value: String(n), label: String(n) }))} /></div>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.offTitle}</h2>
        <p className="text-[11px] text-slate-500">{t.offHint}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{labels.attendance.weekdays.map((d, i) => <Toggle key={d} label={d} checked={region.weekOff[i] ?? false} onChange={(v) => patchRegion({ weekOff: region.weekOff.map((x, k) => (k === i ? v : x)) })} />)}</div>
        <TextField label={t.holidays} value={saved.holidays} onChange={(v) => change({ holidays: v })} placeholder={ex.attendance.holidayPlaceholder} max={2000} multiline={4} hint={t.holidaysHint} />
        {holidays.bad > 0 && <Note>{t.holidaysBad.replace('{n}', String(holidays.bad))}</Note>}
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.moreOptions}</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NumberField label={t.alert} value={saved.minPercent} onChange={(v) => change({ minPercent: v })} min={0} max={100} hint={t.alertHint} />
            <NumberField label={t.spare} value={saved.spare} onChange={(v) => change({ spare: v })} min={0} max={100} hint={t.spareHint} />
          </div>
        </details>
      </section>

      <RegionPanel region={region} onPreset={setPreset} onPatch={patchRegion} />

      <TableInput key={resetKey} name="staff" sampleHeaders={ex.attendance.sampleHeaders} sampleRows={ex.attendance.sampleRows} fields={FIELDS} intro={t.listIntro} onChange={setTable} />
      {table && people.length > MAX_PEOPLE && <Note>{t.tooMany.replace('{n}', String(MAX_PEOPLE))}</Note>}

      <ContentPanel sample={saved.sample} onSample={(v) => change({ sample: v })} hinglish={saved.hinglish} onHinglish={(v) => change({ hinglish: v })} hasList={useList} />
      <BookPreview book={previewBook} region={region} note={useList || saved.sample ? t.previewYours : t.previewSample} />
      <FilePanel getBook={() => make(false)} base="attendance" version={version} onStartAgain={startAgain} blank={!useList && !saved.sample} />
    </div>
  );
};

export default AttendanceWorkbook;
