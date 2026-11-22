import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PdfFileBar } from '../../common/PdfFileBar';
import { UploadNote } from '../../common/UploadNote';
import { copyText, downloadBlob } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { buildTable, DEFAULT_OPTIONS, findRecordSets, recordsOf } from '../../../lib/devtools/jsonToCsv';
import { childrenOf, isContainer, jsonStats, kindOf, parseJson, pathKey, pathLabel, searchJson, sortKeysDeep, valueAtKeys, type JsonKind } from '../../../lib/devtools/jsonTree';
import { CopyButton, ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle } from '../paper/controls';
import { DataTable } from './DataTable';
import { JsonInput } from './JsonInput';
import { JsonTreeNode, PAGE, type TreeContext } from './JsonTreeNode';

const SAMPLE = JSON.stringify({
  company: 'Sharma Stores', founded: 1998, active: true, brandColour: '#ea580c', website: 'https://example.com',
  branches: [
    { city: 'Pune', staff: 12, manager: { name: 'Asha Verma', phone: null }, openDays: ['Mon', 'Tue', 'Wed'] },
    { city: 'Delhi', staff: 8, manager: { name: 'Ravi Kumar', phone: '98xxxxxx10' }, openDays: ['Mon', 'Sat'] },
  ],
  settings: { currency: 'INR', tax: { gst: 18, inclusive: false }, tags: [] },
}, null, 2);

const BUTTON = 'min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50';
const NODE_BUDGET = 3000;

/** A viewer for big or deeply nested JSON: a tree you can open and close, search with jump to match, a table view, the paths of any value, and the formatted text. Done in your browser. */
export const JsonViewer: React.FC = () => {
  const [source, setSource] = useState<{ root: unknown; name: string; size: number } | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'tree' | 'table' | 'text'>('tree');
  const [level, setLevel] = useState(2);
  const [overrides, setOverrides] = useState<Map<string, boolean>>(() => new Map());
  const [shown, setShown] = useState<Map<string, number>>(() => new Map());
  const [query, setQuery] = useState('');
  const [hitIndex, setHitIndex] = useState(0);
  const [selected, setSelected] = useState<{ keys: string[]; kinds: JsonKind[] } | null>(null);
  const [sorted, setSorted] = useState(false);
  const [indent, setIndent] = useState('2');
  const [tableSet, setTableSet] = useState(0);
  const [filter, setFilter] = useState('');
  const frame = useRef<HTMLDivElement>(null);
  const budget = useRef({ left: NODE_BUDGET });

  const load = (text: string, name: string) => {
    const result = parseJson(text);
    if ('error' in result) {
      const where = result.error.line ? ` (line ${result.error.line}, column ${result.error.column})` : '';
      setError(`This is not valid JSON${where}: ${result.error.message}`);
      return;
    }
    setError(''); setOverrides(new Map()); setShown(new Map()); setQuery(''); setSelected(null); setLevel(2); setMode('tree'); setTableSet(0); setFilter('');
    setSource({ root: result.value, name, size: new Blob([text]).size });
  };

  const root = useMemo(() => (source ? (sorted ? sortKeysDeep(source.root) : source.root) : null), [source, sorted]);
  const stats = useMemo(() => (root === null && !source ? null : jsonStats(root)), [root, source]);
  const search = useMemo(() => (root === undefined ? { hits: [], capped: false } : searchJson(root, query)), [root, query]);
  const hitKeys = useMemo(() => new Set(search.hits.map((hit) => pathKey(hit.keys))), [search]);
  const forceOpen = useMemo(() => {
    const open = new Set<string>();
    for (const hit of search.hits) for (let i = 0; i < hit.keys.length; i += 1) open.add(pathKey(hit.keys.slice(0, i)));
    return open;
  }, [search]);
  const safeHit = Math.min(hitIndex, Math.max(0, search.hits.length - 1));
  const currentHit = search.hits[safeHit];
  const currentHitKey = currentHit ? pathKey(currentHit.keys) : null;

  const isOpen = useCallback((key: string, depth: number) => forceOpen.has(key) || (overrides.has(key) ? overrides.get(key)! : depth < level), [forceOpen, overrides, level]);
  const toggle = useCallback((key: string, depth: number) => setOverrides((map) => { const next = new Map(map); next.set(key, !(forceOpen.has(key) || (map.has(key) ? map.get(key)! : depth < level))); return next; }), [forceOpen, level]);
  const showMore = useCallback((key: string) => setShown((map) => new Map(map).set(key, (map.get(key) ?? PAGE) + PAGE)), []);

  // Make sure the page holding the current match is drawn, then scroll to it.
  useEffect(() => {
    if (!currentHit || !root) return;
    setShown((map) => {
      let next = map;
      let node: unknown = root;
      currentHit.keys.forEach((key, depth) => {
        const parentKey = pathKey(currentHit.keys.slice(0, depth));
        const position = childrenOf(node).findIndex(([name]) => name === key);
        if (position >= (next.get(parentKey) ?? PAGE)) { if (next === map) next = new Map(map); next.set(parentKey, (Math.floor(position / PAGE) + 1) * PAGE); }
        node = (node as Record<string, unknown>)[key];
      });
      return next;
    });
    const timer = window.setTimeout(() => frame.current?.querySelector('[data-hit="current"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    return () => window.clearTimeout(timer);
  }, [currentHit, root]);

  const selectedValue = useMemo(() => (selected && root !== null ? valueAtKeys(root, selected.keys) : undefined), [selected, root]);
  const selectedPath = selected ? pathLabel(selected.keys, selected.kinds) : '$';
  const pretty = useMemo(() => (mode === 'text' && root !== null ? JSON.stringify(root, null, Number(indent)) : ''), [mode, root, indent]);
  const lists = useMemo(() => (root ? findRecordSets(root).filter((item) => item.kind !== 'single') : []), [root]);
  const table = useMemo(() => {
    if (mode !== 'table' || !root || lists.length === 0) return null;
    const set = lists[Math.min(tableSet, lists.length - 1)]!;
    return buildTable(recordsOf(root, set), { ...DEFAULT_OPTIONS, protectFormulas: false });
  }, [mode, root, lists, tableSet]);
  const tableRows = useMemo(() => {
    if (!table) return [];
    const needle = filter.trim().toLowerCase();
    return needle ? table.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(needle))) : table.rows;
  }, [table, filter]);

  if (!source || root === null || !stats) {
    return (
      <section className="mx-auto min-w-0">
        <JsonInput onLoad={load} sample={SAMPLE} actionLabel="View JSON" error={error} />
      </section>
    );
  }

  budget.current.left = NODE_BUDGET;
  const ctx: TreeContext = {
    isOpen, toggle, showMore, shown, query, hitKeys, currentHitKey, budget: budget.current,
    select: (keys, kinds) => setSelected({ keys, kinds }),
    selectedKey: selected ? pathKey(selected.keys) : null,
  };
  const go = (step: number) => { if (search.hits.length) setHitIndex((safeHit + step + search.hits.length) % search.hits.length); };
  const container = isContainer(selectedValue);
  const valueText = selectedValue === undefined ? '' : JSON.stringify(selectedValue, null, 2);

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <PdfFileBar name={source.name || 'Pasted JSON'} size={source.size} onChange={() => { setSource(null); setError(''); }} />

      <ul className="flex flex-wrap gap-1.5 text-[11px] text-slate-600" aria-label="What is in this JSON">
        {[[`${stats.counts.object.toLocaleString('en-IN')} objects`], [`${stats.counts.array.toLocaleString('en-IN')} lists`], [`${(stats.counts.string + stats.counts.number + stats.counts.boolean + stats.counts.null).toLocaleString('en-IN')} values`], [`${stats.keys.toLocaleString('en-IN')} keys`], [`${stats.maxDepth} levels deep`]].map(([text]) => <li key={text} className="rounded-full bg-slate-100 px-2.5 py-1">{text}</li>)}
      </ul>

      <ChoiceButtons label="View as" value={mode} onChange={(value) => setMode(value as 'tree' | 'table' | 'text')} options={[{ value: 'tree', label: 'Tree' }, { value: 'table', label: 'Table' }, { value: 'text', label: 'Formatted text' }]} />

      {mode === 'tree' && (
        <>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={BUTTON} onClick={() => { setLevel(Infinity); setOverrides(new Map()); }}>Expand all</button>
              <button type="button" className={BUTTON} onClick={() => { setLevel(1); setOverrides(new Map()); }}>Collapse all</button>
              {[1, 2, 3, 4].map((n) => <button key={n} type="button" className={BUTTON} onClick={() => { setLevel(n); setOverrides(new Map()); }} title={`Open down to level ${n}`}>Level {n}</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-0 flex-1 basis-56">
                <span className="sr-only">Search keys and values</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setHitIndex(0); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); go(event.shiftKey ? -1 : 1); } }} placeholder="Search keys and values" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
              </label>
              {query.trim() && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600" aria-live="polite">
                  <span>{search.hits.length ? `${safeHit + 1} of ${search.hits.length}${search.capped ? '+' : ''}` : 'No match'}</span>
                  <button type="button" className={BUTTON} onClick={() => go(-1)} disabled={!search.hits.length} aria-label="Previous match"><ChevronUp className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" className={BUTTON} onClick={() => go(1)} disabled={!search.hits.length} aria-label="Next match"><ChevronDown className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              )}
            </div>
            <Toggle label="Sort keys A to Z" checked={sorted} onChange={setSorted} />
          </div>

          <div ref={frame} role="tree" aria-label="JSON tree" className="max-h-[36rem] overflow-auto rounded-xl border border-slate-200 bg-white p-2">
            <JsonTreeNode value={root} keys={[]} kinds={[]} depth={0} ctx={ctx} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" aria-live="polite">
            {selected ? (
              <>
                <p className="font-semibold text-slate-700">Selected: <span className="break-all font-mono font-normal text-slate-900">{selectedPath}</span> <span className="text-slate-500">({kindOf(selectedValue)}{container ? `, ${(Array.isArray(selectedValue) ? selectedValue.length : Object.keys(selectedValue as object).length).toLocaleString('en-IN')} ${Array.isArray(selectedValue) ? 'items' : 'keys'}` : ''})</span></p>
                {!container && <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-slate-700">{valueText}</p>}
                <div className="mt-2 flex flex-wrap gap-2"><CopyButton text={selectedPath} label="Copy path" /><CopyButton text={valueText} label={container ? 'Copy this part as JSON' : 'Copy value'} /></div>
              </>
            ) : <p className="text-slate-500">Tap any row to see its path and copy it or its value.</p>}
          </div>
        </>
      )}

      {mode === 'table' && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          {lists.length === 0 ? <p className="text-xs text-slate-600">There is no list of records in this JSON to show as a table. Use the tree instead.</p> : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">List to show
                  <select value={Math.min(tableSet, lists.length - 1)} onChange={(event) => setTableSet(Number(event.target.value))} className={fieldClass}>
                    {lists.map((item, index) => <option key={`${item.path}-${index}`} value={index}>{item.path || 'Top level'} ({item.count.toLocaleString('en-IN')})</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Filter rows
                  <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Type to show matching rows" className={fieldClass} />
                </label>
              </div>
              {table && <DataTable caption="The list as a table" columns={table.columns} rows={tableRows} maxRows={200} maxColumns={30} />}
              <p className="text-xs text-slate-600">Need the whole table in a spreadsheet? <Link to="/json-to-csv-converter" className="font-semibold text-orange-800 underline">Convert this JSON to CSV</Link>.</p>
            </>
          )}
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-3">
            <ChoiceButtons label="Indentation" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: '0', label: 'Minified' }]} />
            <Toggle label="Sort keys A to Z" checked={sorted} onChange={setSorted} />
          </div>
          <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800">{pretty.length > 400_000 ? `${pretty.slice(0, 400_000)}\n\n… The rest is left out of this view. Copy or save to get everything.` : pretty}</pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BUTTON} onClick={() => { void copyText(pretty); }}>Copy text</button>
            <button type="button" className={BUTTON} onClick={() => downloadBlob(new Blob([pretty], { type: 'application/json;charset=utf-8' }), generateFileName('formatted-json', 'json', { base: source.name }))}>Save as .json</button>
          </div>
        </div>
      )}
      <UploadNote>Your JSON stays in this browser. Links in values open in a new tab only when you tap them.</UploadNote>
    </section>
  );
};

export default JsonViewer;
