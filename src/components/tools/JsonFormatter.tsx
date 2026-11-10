import React, { useState } from 'react';
import { AlertCircle, Check, Clipboard, Download, RotateCcw, Sparkles } from 'lucide-react';
import { copyText, downloadBlob } from '../../lib/browserTools';
import { FileDropZone } from '../common/FileDropZone';

type JsonAction = 'format' | 'minify' | 'validate';

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonKeys(child)]),
    );
  }
  return value;
}

const SAMPLE_JSON = `{
  "name": "Browser Tools",
  "features": ["format", "validate", "minify"],
  "clientSide": true,
  "settings": {
    "indent": 2
  }
}`;

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const process = (action: JsonAction) => {
    setError('');
    setStatus('');
    setIsCopied(false);
    if (!input.trim()) {
      setOutput('');
      setError('Paste JSON or open a .json file to get started.');
      return;
    }

    try {
      const parsed: unknown = JSON.parse(input);
      const value = sortKeys ? sortJsonKeys(parsed) : parsed;
      if (action === 'validate') {
        setOutput(JSON.stringify(value, null, indent));
        setStatus('Valid JSON. No syntax errors found.');
      } else {
        setOutput(JSON.stringify(value, null, action === 'format' ? indent : 0));
        setStatus(action === 'format' ? 'JSON formatted successfully.' : 'JSON minified successfully.');
      }
    } catch (reason) {
      setOutput('');
      const details = reason instanceof Error ? reason.message : 'The input is not valid JSON.';
      setError(`Invalid JSON: ${details}`);
    }
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json' && file.type !== 'text/plain') {
      setError('Choose a .json or plain-text file.');
      return;
    }
    try {
      setInput(await file.text());
      setOutput('');
      setError('');
      setStatus(`Loaded ${file.name}. Choose Format or Validate to inspect it.`);
    } catch (reason) {
      setError(reason instanceof Error ? `Could not read the file: ${reason.message}` : 'Could not read this file.');
    }
  };

  const copyOutput = async () => {
    try {
      await copyText(output);
      setIsCopied(true);
      setStatus('Output copied to clipboard.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not copy the output.');
    }
  };

  const reset = () => {
    setInput('');
    setOutput('');
    setError('');
    setStatus('');
    setIsCopied(false);
  };

  return (
    <section className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      <div className="mb-4">
        <FileDropZone
          accept=".json,application/json,text/plain"
          onFiles={(files) => { void loadFile(files[0]); }}
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700">
          Indentation
          <select value={indent} onChange={(event) => setIndent(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>1 space</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} className="accent-indigo-600" />
            Sort object keys
          </label>
          <button type="button" onClick={() => { setInput(SAMPLE_JSON); setOutput(''); setError(''); setStatus('Sample JSON loaded.'); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Sparkles className="h-3.5 w-3.5" />Example</button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 min-h-10 text-xs font-medium text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />Clear</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Input JSON
          <textarea value={input} onChange={(event) => { setInput(event.target.value); setError(''); setStatus(''); }} spellCheck={false} rows={18} placeholder={'Paste JSON here, e.g. {"name":"Example"}'} className="mt-1.5 w-full resize-y rounded-xl border border-stone-200 bg-white p-4 font-mono text-xs leading-relaxed text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          <span className="mt-1 block text-right font-normal text-slate-400">{input.length.toLocaleString()} characters</span>
        </label>
        <div className="block min-w-0 text-xs font-semibold text-slate-700">
          Output
          <pre className="mt-1.5 min-h-[452px] max-h-[560px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800">{output || <span className="font-sans text-slate-400">Formatted JSON will appear here.</span>}</pre>
          {output && <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => void copyOutput()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}{isCopied ? 'Copied' : 'Copy output'}</button>
            <button type="button" onClick={() => downloadBlob(new Blob([output], { type: 'application/json;charset=utf-8' }), 'formatted.json')} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Download className="h-3.5 w-3.5" />Download .json</button>
          </div>}
        </div>
      </div>

      {input.trim() && <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => process('format')} className="rounded-xl bg-orange-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">Format / Beautify</button>
        <button type="button" onClick={() => process('minify')} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Minify JSON</button>
        <button type="button" onClick={() => process('validate')} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Validate JSON</button>
      </div>}
      {status && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><Check className="h-4 w-4 shrink-0" />{status}</p>}
      {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">JSON parsing and formatting run locally in your browser. This tool does not evaluate code or send your data to a server.</p>
    </section>
  );
};
