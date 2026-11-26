import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChoiceButtons } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { Note } from '../../finance/ui';
import { saveBlob } from '../../../lib/images/canvas';
import { toCsv, toXlsx } from '../../../lib/pdftable/write';
import { MAX_ROWS, TableReadError, readFile, readText, type RawTable } from '../../../lib/table/read';
import { shape, suggestMapping, type Field, type Shaped } from '../../../lib/table/shape';
import ui from '../../../locales/packs/tableinput.ui.en.json';

export type { Field } from '../../../lib/table/shape';
export interface TableValue { headers: string[]; rows: string[][]; mapping: Record<string, number>; shaped: Shaped; raw: RawTable }
interface Props {
  /** Used for saved sample file names. */
  name: string;
  sampleHeaders: string[];
  sampleRows: string[][];
  /** Columns the tool needs, matched to the headings. Leave out when the tool uses every column by its heading. */
  fields?: Field[];
  disabled?: boolean;
  onChange: (value: TableValue | null) => void;
  /** What to say about the headings, for example which columns are needed. */
  intro?: string;
}

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const selectClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const NO_FIELDS: Field[] = [];
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((out, [k, v]) => out.replace(`{${k}}`, String(v)), text);

/** One place to bring a list into a tool: paste it, or upload a CSV or Excel file. Shows how to arrange the sheet and what was read, so people can check it. */
export const TableInput: React.FC<Props> = ({ name, sampleHeaders, sampleRows, fields = NO_FIELDS, disabled, onChange, intro }) => {
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [raw, setRaw] = useState<RawTable | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState(0);
  const [headings, setHeadings] = useState<boolean | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async (task: () => Promise<RawTable> | RawTable) => {
    setError(''); setOverrides({}); setHeadings(null);
    try { setRaw(await task()); } catch (e) { setRaw(null); setError(e instanceof TableReadError ? ui.errors[e.code] : ui.errors.unreadable); }
  };
  useEffect(() => {
    if (mode !== 'paste') return;
    if (text.trim() === '') { setRaw(null); setError(''); return; }
    void load(() => readText(text)); // eslint-disable-line react-hooks/exhaustive-deps
  }, [text, mode]);

  const guessed = useMemo(() => (raw ? shape(raw, true).headerGuessed : false), [raw]);
  const useHeadings = headings ?? guessed;
  const shaped = useMemo(() => (raw ? shape(raw, useHeadings) : null), [raw, useHeadings]);
  const suggested = useMemo(() => (shaped ? suggestMapping(fields, shaped.headers) : {}), [shaped, fields]);
  const mapping = useMemo(() => ({ ...suggested, ...overrides }), [suggested, overrides]);

  useEffect(() => { onChange(raw && shaped ? { headers: shaped.headers, rows: shaped.rows, mapping, shaped, raw } : null); }, [raw, shaped, mapping]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (chosen: File | undefined, sheetIndex = 0) => { if (!chosen) return; setFile(chosen); setSheet(sheetIndex); await load(() => readFile(chosen, sheetIndex)); };
  const clear = () => { setText(''); setRaw(null); setFile(null); setError(''); setOverrides({}); setHeadings(null); if (fileInput.current) fileInput.current.value = ''; };
  const sampleSheets = () => [{ name: 'Sample', rows: [sampleHeaders, ...sampleRows] }];

  const info = raw?.info;
  const warnings: string[] = [];
  if (info && shaped) {
    if (info.truncated) warnings.push(fill(ui.warnTruncated, { max: MAX_ROWS }));
    if (info.blankRowsSkipped) warnings.push(fill(ui.warnBlank, { n: info.blankRowsSkipped }));
    if (info.mergedCells) warnings.push(fill(ui.warnMerged, { n: info.mergedCells }));
    if (info.hiddenRows) warnings.push(fill(ui.warnHiddenRows, { n: info.hiddenRows }));
    if (info.hiddenSheets) warnings.push(fill(ui.warnHiddenSheets, { n: info.hiddenSheets }));
    if (info.formulasWithoutValue) warnings.push(fill(ui.warnFormulas, { n: info.formulasWithoutValue }));
    if (info.errorCells) warnings.push(fill(ui.warnErrors, { n: info.errorCells }));
    if (info.datesRead) warnings.push(fill(ui.warnDates, { n: info.datesRead }));
    if (shaped.duplicates) warnings.push(fill(ui.warnDuplicates, { n: shaped.duplicates }));
    const totals = shaped.rows.filter((r) => /^(grand\s+)?(sub\s?)?totals?\b/i.test(r[0] ?? '')).length;
    if (totals) warnings.push(fill(ui.warnTotals, { n: totals }));
    if (info.source === 'csv' && info.encoding === 'Windows-1252') warnings.push(ui.warnEncoding);
  }
  const previewRows = shaped ? (shaped.rows.length <= 8 ? shaped.rows.map((r, i) => ({ r, n: i + 1 })) : [...shaped.rows.slice(0, 5).map((r, i) => ({ r, n: i + 1 })), ...shaped.rows.slice(-2).map((r, i) => ({ r, n: shaped.rows.length - 1 + i }))]) : [];
  const gap = shaped && shaped.rows.length > 8 ? shaped.rows.length - 7 : 0;

  return (
    <section className={`${card} space-y-3`}>
      <h2 className={heading}>{ui.title}</h2>
      {intro && <p className="text-[11px] text-slate-500">{intro}</p>}
      <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.mode}</p>
        <ChoiceButtons label={ui.mode} value={mode} onChange={(v) => { setMode(v as 'paste' | 'file'); clear(); }} options={[{ value: 'paste', label: ui.paste }, { value: 'file', label: ui.upload }]} /></div>

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.helpTitle}</summary>
        <div className="mt-2 space-y-2">
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">{ui.helpRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          <p className="text-xs font-semibold text-slate-700">{ui.helpSample}</p>
          <div className="overflow-x-auto"><table className="min-w-full border-collapse text-xs">
            <thead><tr>{sampleHeaders.map((h) => <th key={h} className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-bold text-slate-900">{h}</th>)}</tr></thead>
            <tbody>{sampleRows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border border-slate-200 px-2 py-1 text-slate-800">{c}</td>)}</tr>)}</tbody></table></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => saveBlob(toCsv(sampleSheets()), `${name}-sample.csv`)}>{ui.sampleCsv}</button>
            <button type="button" className={buttonClass} onClick={() => void toXlsx(sampleSheets()).then((blob) => saveBlob(blob, `${name}-sample.xlsx`))}>{ui.sampleXlsx}</button>
          </div>
        </div>
      </details>

      {mode === 'paste' ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">{ui.pasteHint}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} disabled={disabled} placeholder={ui.pastePlaceholder} aria-label={ui.title}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={disabled} onClick={() => setText([sampleHeaders, ...sampleRows].map((r) => r.join('\t')).join('\n'))}>{ui.useSample}</button>
            {text && <button type="button" className={buttonClass} disabled={disabled} onClick={clear}>{ui.clear}</button>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">{ui.fileHint}</p>
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonClass} cursor-pointer`}>{ui.chooseFile}<input ref={fileInput} type="file" accept=".csv,.tsv,.txt,.xlsx,.xlsm,text/csv" className="sr-only" disabled={disabled} onChange={(e) => void pick(e.target.files?.[0])} /></label>
            {file && <button type="button" className={buttonClass} disabled={disabled} onClick={clear}>{ui.clear}</button>}
          </div>
        </div>
      )}
      {error && <Note>{error}</Note>}

      {raw && shaped && info && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3" aria-live="polite">
          <h3 className="text-sm font-bold text-slate-900">{ui.readTitle}</h3>
          <p className="text-xs font-semibold text-slate-800">{fill(ui.readLine, { rows: shaped.rows.length, columns: shaped.headers.length })}</p>
          <ul className="space-y-0.5 text-[11px] text-slate-600">
            {info.source === 'paste' ? <li>{ui.fromPaste}</li> : <li>{fill(ui.fromFile, { name: info.fileName })}</li>}
            {info.source === 'xlsx' && <li>{fill(ui.fromSheet, { name: info.sheetName })}</li>}
            {info.source !== 'xlsx' && info.delimiter && <li>{fill(ui.separator, { name: (ui.separators as Record<string, string>)[info.delimiter] ?? info.delimiter })}</li>}
            {info.source === 'csv' && <li>{fill(ui.encoding, { name: info.encoding })}</li>}
          </ul>
          {info.sheetNames.length > 1 && (
            <label className="block text-xs font-semibold text-slate-700">{ui.pickSheet}
              <select value={sheet} onChange={(e) => void pick(file ?? undefined, Number(e.target.value))} className={selectClass}>{info.sheetNames.map((n, i) => <option key={n + i} value={i}>{n}</option>)}</select></label>
          )}
          <label className="flex items-start gap-2 text-xs text-slate-800"><input type="checkbox" checked={useHeadings} onChange={(e) => setHeadings(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-700" />
            <span><span className="font-semibold">{ui.firstRowHeadings}</span><span className="block text-[11px] text-slate-500">{guessed ? ui.headingsGuess : ui.noHeadingsGuess}</span></span></label>
          <p className="text-[11px] font-semibold text-slate-700">{ui.checkRows}</p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-full border-collapse text-xs">
            <thead>
              <tr><th className="border-b border-slate-200 px-2 py-1 text-left font-semibold text-slate-500">{ui.rowNumber}</th>{shaped.headers.map((h, i) => <th key={i} className="border-b border-slate-200 bg-slate-100 px-2 py-1 text-left font-bold text-slate-900">{h}</th>)}</tr>
              <tr><th className="px-2 pb-1" />{shaped.kinds.map((k, i) => <th key={i} className="px-2 pb-1 text-left text-[10px] font-normal text-slate-500">{ui.kinds[k]}, {fill(ui.filled, { n: shaped.filled[i]! })}</th>)}</tr>
            </thead>
            <tbody>
              {previewRows.map(({ r, n }, i) => (
                <Fragment key={`${n}-${i}`}>
                  {gap > 0 && i === 5 && <tr><td colSpan={shaped.headers.length + 1} className="px-2 py-1 text-center text-[11px] text-slate-500">{fill(ui.moreRows, { n: gap })}</td></tr>}
                  <tr className="border-t border-slate-100"><td className="px-2 py-1 text-slate-500">{n}</td>{r.map((c, j) => <td key={j} className="px-2 py-1 text-slate-900">{c}</td>)}</tr>
                </Fragment>
              ))}
            </tbody></table></div>
          {fields.length > 0 && (
            <div className="space-y-2"><h3 className="text-sm font-bold text-slate-900">{ui.mapTitle}</h3><p className="text-[11px] text-slate-500">{ui.mapHint}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{fields.map((f) => (
                <label key={f.key} className="block text-xs font-semibold text-slate-700">{f.label}{f.required ? ' *' : ''}
                  <select value={mapping[f.key] ?? -1} onChange={(e) => setOverrides((o) => ({ ...o, [f.key]: Number(e.target.value) }))} className={selectClass}>
                    <option value={-1}>{ui.mapNone}</option>{shaped.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                  {f.required && (mapping[f.key] ?? -1) < 0 && <span className="text-[11px] font-semibold text-red-700">{ui.mapRequired}</span>}</label>))}</div></div>
          )}
          {warnings.length > 0 ? (
            <div><p className="text-xs font-bold text-slate-900">{ui.warnings}</p><ul className="mt-1 list-disc space-y-1 pl-5 text-[11px] text-slate-700">{warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
          ) : <p className="text-[11px] font-semibold text-green-800">{ui.allGood}</p>}
        </div>
      )}
    </section>
  );
};

export default TableInput;
