import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { MainActionButton } from '../../common/MainActionButton';
import { PdfFileBar } from '../../common/PdfFileBar';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { UploadNote } from '../../common/UploadNote';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { buildTable, DEFAULT_OPTIONS, findRecordSets, recordsOf, toCsv, type ArrayMode, type CsvOptions, type Delimiter } from '../../../lib/devtools/jsonToCsv';
import { parseJson } from '../../../lib/devtools/jsonTree';
import { CopyButton, ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { DataTable } from './DataTable';
import { JsonInput } from './JsonInput';

const SAMPLE = JSON.stringify({ shop: 'Sharma Stores', orders: [
  { id: 1001, customer: { name: 'Asha Verma', city: 'Pune' }, items: ['rice', 'dal'], total: 640.5, paid: true },
  { id: 1002, customer: { name: 'Ravi Kumar', city: 'Delhi' }, items: ['tea'], total: 120, paid: false },
  { id: 1003, customer: { name: 'Meena, S.', city: 'Jaipur' }, items: [], total: 0, paid: null },
] }, null, 2);

/** Turn JSON into a CSV file for Excel or Google Sheets. Finds the list of records, flattens nested values and lets you choose the columns. Done in your browser. */
export const JsonToCsv: React.FC = () => {
  const saved = useResultFile();
  const [source, setSource] = useState<{ root: unknown; name: string; size: number } | null>(null);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<CsvOptions>(DEFAULT_OPTIONS);
  const [bom, setBom] = useState(true);
  const [setIndex, setSetIndex] = useState(0);
  const [dropped, setDropped] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = (text: string, name: string) => {
    const result = parseJson(text);
    if ('error' in result) {
      const where = result.error.line ? ` (line ${result.error.line}, column ${result.error.column})` : '';
      setError(`This is not valid JSON${where}: ${result.error.message}`);
      return;
    }
    if (result.value === null || typeof result.value !== 'object') { setError('The JSON needs to be a list [ ... ] or an object { ... } to make a table.'); return; }
    setError(''); saved.clear(); setSetIndex(0); setDropped([]);
    setSource({ root: result.value, name, size: new Blob([text]).size });
  };
  const startOver = () => { saved.clear(); setSource(null); setError(''); setDropped([]); };

  const sets = useMemo(() => (source ? findRecordSets(source.root) : []), [source]);
  const active = sets[Math.min(setIndex, sets.length - 1)];
  const table = useMemo(() => (source && active ? buildTable(recordsOf(source.root, active), options) : null), [source, active, options]);
  const kept = table ? table.columns.filter((name) => !dropped.includes(name)) : [];
  const previewIndexes = table ? table.columns.map((name, index) => ({ name, index })).filter((column) => kept.includes(column.name)) : [];
  const settingsKey = JSON.stringify([source?.name, source?.size, setIndex, options, bom, dropped]);
  const outdated = saved.isOutdated(settingsKey);
  const csvText = useMemo(() => (saved.result && table ? toCsv(table, options, kept) : ''), [saved.result, table, options, dropped]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof CsvOptions>(key: K, value: CsvOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));

  const convert = () => {
    if (!table) return;
    setBusy(true);
    window.setTimeout(() => {
      const csv = toCsv(table, options, kept);
      saved.set(new Blob([bom ? '﻿' : '', csv], { type: 'text/csv;charset=utf-8' }), generateFileName('json-to-csv', 'csv', { base: source?.name || 'data' }), { key: settingsKey, detail: `${table.rows.length.toLocaleString('en-IN')} rows, ${kept.length} columns` });
      setBusy(false);
    }, 0);
  };

  if (!source || !table || !active) {
    return (
      <section className="mx-auto min-w-0 space-y-4">
        <JsonInput onLoad={load} sample={SAMPLE} actionLabel="Read JSON" error={error} />
      </section>
    );
  }

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <PdfFileBar name={source.name || 'Pasted JSON'} size={source.size} onChange={startOver} />

      {sets.length > 1 && (
        <div className={`${card} space-y-2`}>
          <h2 className={heading}>Which list should become the table?</h2>
          <select value={Math.min(setIndex, sets.length - 1)} onChange={(event) => { setSetIndex(Number(event.target.value)); setDropped([]); saved.clear(); }} className={fieldClass} aria-label="List to convert">
            {sets.map((item, index) => <option key={`${item.path}-${index}`} value={index}>{item.path || 'Top level'} ({item.count.toLocaleString('en-IN')} {item.kind === 'keyed' ? 'entries' : 'records'})</option>)}
          </select>
        </div>
      )}

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>How to write the CSV</h2>
        <div>
          <p className="text-xs font-semibold text-slate-700">Separator</p>
          <div className="mt-1.5"><ChoiceButtons label="Separator" value={options.delimiter} onChange={(value) => set('delimiter', value as Delimiter)} options={[{ value: ',', label: 'Comma' }, { value: ';', label: 'Semicolon' }, { value: '\t', label: 'Tab' }, { value: '|', label: 'Pipe' }]} /></div>
        </div>
        <Toggle label="Spread nested objects into columns" hint="address: { city } becomes a column named address.city. Turn off to keep it as JSON text in one cell." checked={options.flatten} onChange={(value) => set('flatten', value)} />
        <div>
          <p className="text-xs font-semibold text-slate-700">Lists inside a record</p>
          <div className="mt-1.5"><ChoiceButtons label="Lists inside a record" value={options.arrayMode} onChange={(value) => set('arrayMode', value as ArrayMode)} options={[{ value: 'join', label: 'Join with ; in one cell' }, { value: 'columns', label: 'One column per item' }, { value: 'json', label: 'Keep as JSON text' }]} /></div>
        </div>
        <Toggle label="First row has the column names" checked={options.header} onChange={(value) => set('header', value)} />
        <Toggle label="Put every value in quotes" checked={options.quoteAll} onChange={(value) => set('quoteAll', value)} />
        <Toggle label="Make it safe to open in a spreadsheet" hint="Text that starts with = + - or @ gets an apostrophe in front, so Excel cannot run it as a formula." checked={options.protectFormulas} onChange={(value) => set('protectFormulas', value)} />
        <Toggle label="Excel-friendly file (UTF-8 with a byte order mark)" hint="Keeps Hindi and other non-English letters correct when the file is opened in Excel." checked={bom} onChange={setBom} />
        <label className="block text-xs font-semibold text-slate-700">Text for empty or null values
          <input value={options.emptyText} onChange={(event) => set('emptyText', event.target.value)} placeholder="Leave empty for a blank cell" className={`${fieldClass} sm:max-w-xs`} />
        </label>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Columns ({kept.length} of {table.columns.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDropped([])} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Select all</button>
          <button type="button" onClick={() => setDropped(table.columns)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Select none</button>
        </div>
        <ul className="grid max-h-56 gap-1.5 overflow-auto sm:grid-cols-2">
          {table.columns.map((name) => (
            <li key={name}>
              <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700">
                <input type="checkbox" checked={!dropped.includes(name)} onChange={(event) => setDropped((list) => (event.target.checked ? list.filter((item) => item !== name) : [...list, name]))} />
                <span className="min-w-0 truncate font-mono" title={name}>{name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${card} space-y-2`}>
        <h2 className={heading}>Preview</h2>
        {kept.length > 0
          ? <DataTable caption="The first rows of the CSV" columns={previewIndexes.map((column) => column.name)} rows={table.rows.map((row) => previewIndexes.map((column) => row[column.index] ?? ''))} />
          : <p className="text-xs text-red-700" role="alert">Select at least one column.</p>}
      </div>

      {(!saved.result || outdated) && <MainActionButton onClick={convert} disabled={kept.length === 0} busy={busy} busyLabel="Converting...">Convert to CSV</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your CSV file is ready" saveLabel="Save CSV" detail={saved.result.detail} outdated={outdated} />
          {!outdated && (
            <div className="flex flex-wrap items-center gap-2"><CopyButton text={csvText} label="Copy CSV text" /><span className="inline-flex items-center gap-1 text-xs text-slate-500"><Check className="h-3.5 w-3.5" aria-hidden="true" />Nothing was uploaded.</span></div>
          )}
          {!outdated && <StartOverButton onClick={startOver}>Convert another JSON</StartOverButton>}
        </div>
      )}
      <UploadNote>Very long numbers (more than 15 digits) can lose their last digits when JSON is read. Keep such IDs as text in the JSON.</UploadNote>
    </section>
  );
};

export default JsonToCsv;
