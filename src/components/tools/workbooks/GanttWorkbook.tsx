import React, { useDeferredValue, useMemo, useState } from 'react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { TableInput, type TableValue } from '../shared/TableInput';
import { buildGantt, sampleGantt, suggestTimeline, type GanttTask } from '../../../lib/workbooks/gantt';
import { parseDate, parseShare } from '../../../lib/workbooks/dates';
import ui from '../../../locales/packs/workbooks.ui.en.json';
import ex from '../../../locales/packs/workbooks.examples.en.json';
import { BookPreview, ContentPanel, FilePanel, NumberField, RegionPanel, TextField, usePersisted, useRegion } from './shared';

type StarterId = keyof typeof ex.gantt.starters;
const STARTERS = Object.keys(ex.gantt.starters) as StarterId[];
interface Saved { starter: StarterId; project: string; unit: 'auto' | 'days' | 'weeks'; spare: number; sample: boolean; hinglish: boolean }
const DEFAULTS: Saved = { starter: 'website', project: '', unit: 'auto', spare: 10, sample: false, hinglish: false };
const MAX_TASKS = 200;
const t = ui.gantt;
const FIELDS = [
  { key: 'task', label: t.fieldTask, aliases: ['task name', 'activity', 'work', 'item', 'name'], required: true },
  { key: 'owner', label: t.fieldOwner, aliases: ['assigned to', 'responsible', 'person', 'who'] },
  { key: 'start', label: t.fieldStart, aliases: ['start date', 'begin', 'from'] },
  { key: 'end', label: t.fieldEnd, aliases: ['end date', 'finish', 'due', 'due date', 'deadline', 'to'] },
  { key: 'days', label: t.fieldDays, aliases: ['duration', 'number of days'] },
  { key: 'done', label: t.fieldDone, aliases: ['progress', 'complete', 'percent', 'status', '%'] },
];

/** Project timeline (Gantt chart) Excel maker: a task list that draws its own timeline. Runs in the browser. */
export const GanttWorkbook: React.FC = () => {
  const [saved, change, reset] = usePersisted<Saved>('mdu_wb_gantt_v1', DEFAULTS);
  const [region, setPreset, patchRegion] = useRegion();
  const [table, setTable] = useState<TableValue | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const starter = ex.gantt.starters[saved.starter] ?? ex.gantt.starters.website;
  const order = region.date.startsWith('mm') ? 'mdy' : 'dmy';

  const read = useMemo(() => {
    if (!table) return { tasks: [] as GanttTask[], noDates: 0, cut: 0 };
    const m = table.mapping, cell = (r: string[], key: string) => (m[key] !== undefined && m[key]! >= 0 ? (r[m[key]!] ?? '').trim() : '');
    let noDates = 0; const tasks: GanttTask[] = [];
    for (const r of table.rows) {
      const task = cell(r, 'task'); if (!task) continue;
      const start = parseDate(cell(r, 'start'), order), days = Number(cell(r, 'days').replace(',', '.')) || 0;
      const end = parseDate(cell(r, 'end'), order) ?? (start !== null && days > 0 ? start + days - 1 : null);
      if (start === null || end === null) noDates += 1;
      tasks.push({ task, owner: cell(r, 'owner'), start, end: end !== null && start !== null && end < start ? start : end, done: parseShare(cell(r, 'done')) });
    }
    return { tasks: tasks.slice(0, MAX_TASKS), noDates, cut: Math.max(0, tasks.length - MAX_TASKS) };
  }, [table, order]);

  const useList = read.tasks.length > 0, sampleTasks = useMemo(() => sampleGantt(starter.tasks), [starter]);
  const make = (forceSample: boolean) => {
    const tasks = useList ? read.tasks : saved.sample || forceSample ? sampleTasks : [];
    const line = suggestTimeline(tasks, saved.unit);
    return buildGantt({ project: saved.project || (tasks === sampleTasks ? starter.project : ''), tasks, spareRows: saved.spare, columns: line.columns, unit: line.unit, startDate: null, region, hinglish: saved.hinglish });
  };
  const deferred = useDeferredValue({ saved, region, read, forceSample: !useList && !saved.sample });
  const previewBook = useMemo(() => make(deferred.forceSample), [deferred.saved, deferred.region, deferred.read, starter]); // eslint-disable-line react-hooks/exhaustive-deps
  const version = JSON.stringify([saved, region, read.tasks.length, read.tasks[0]?.task]);
  const startAgain = () => { reset(); setTable(null); setResetKey((k) => k + 1); };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.starters}</p>
          <ChoiceButtons label={t.starters} value={saved.starter} onChange={(v) => change({ starter: v as StarterId, project: ex.gantt.starters[v as StarterId].project })} options={STARTERS.map((id) => ({ value: id, label: ex.gantt.starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{starter.hint}</p></div>
        <TextField label={t.project} value={saved.project} onChange={(v) => change({ project: v })} placeholder={starter.project} max={70} />
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.moreOptions}</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.unit}</p>
              <ChoiceButtons label={t.unit} value={saved.unit} onChange={(v) => change({ unit: v as Saved['unit'] })} options={[{ value: 'auto', label: t.unitAuto }, { value: 'days', label: t.unitDays }, { value: 'weeks', label: t.unitWeeks }]} />
              <p className="mt-1 text-[11px] text-slate-500">{t.unitHint}</p></div>
            <NumberField label={t.spare} value={saved.spare} onChange={(v) => change({ spare: v })} min={0} max={100} hint={t.spareHint} />
          </div>
        </details>
      </section>

      <RegionPanel region={region} onPreset={setPreset} onPatch={patchRegion} />

      <TableInput key={resetKey} name="tasks" sampleHeaders={ex.gantt.sampleHeaders} sampleRows={ex.gantt.sampleRows} fields={FIELDS} intro={t.listIntro} onChange={setTable} />
      {table && read.noDates > 0 && <Note>{t.noDates.replace('{n}', String(read.noDates))}</Note>}
      {table && read.cut > 0 && <Note>{t.tooMany.replace('{n}', String(MAX_TASKS))}</Note>}

      <ContentPanel sample={saved.sample} onSample={(v) => change({ sample: v })} hinglish={saved.hinglish} onHinglish={(v) => change({ hinglish: v })} hasList={useList} />
      <BookPreview book={previewBook} region={region} note={useList || saved.sample ? t.previewYours : t.previewSample} />
      <FilePanel getBook={() => make(false)} base="gantt" version={version} onStartAgain={startAgain} blank={!useList && !saved.sample} />
    </div>
  );
};

export default GanttWorkbook;
