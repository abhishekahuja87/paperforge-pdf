import React, { useState } from 'react';
import { FileDropZone } from '../../common/FileDropZone';
import { MainActionButton } from '../../common/MainActionButton';
import { UploadNote } from '../../common/UploadNote';
import { fieldClass } from '../utilities/common';
import { relaxJson } from '../../../lib/devtools/jsonTree';

const MAX_BYTES = 50 * 1024 * 1024;

interface JsonInputProps {
  /** Called with the JSON text and the file name ("" for pasted text). */
  onLoad: (text: string, name: string) => void;
  sample: string;
  /** Name of the main button, for example "Read JSON". */
  actionLabel: string;
  /** Problem with the last text, shown under the box. */
  error?: string;
}

/** The same way in for both JSON tools: choose a file or paste text, then press the main button. */
export const JsonInput: React.FC<JsonInputProps> = ({ onLoad, sample, actionLabel, error }) => {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');
  const [reading, setReading] = useState(false);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) { setProblem('That file is over 50 MB. Open a smaller part of it.'); return; }
    setReading(true); setProblem('');
    try { const content = await file.text(); setText(content.length < 2_000_000 ? content : ''); onLoad(content, file.name); } catch { setProblem('Could not read that file.'); } finally { setReading(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropZone accept=".json,application/json,text/plain" readingPdf={reading} disabled={reading} onFiles={(files) => { void openFile(files[0]); }} />
      <UploadNote>Or paste JSON below. It is read in your browser and never uploaded.</UploadNote>
      <label className="block text-xs font-semibold text-slate-700">Paste JSON
        <textarea value={text} onChange={(event) => { setText(event.target.value); setProblem(''); }} spellCheck={false} rows={10} placeholder={'{"name": "Example", "items": [1, 2, 3]}'} className={`${fieldClass} resize-y font-mono text-xs`} />
        <span className="mt-1 flex items-center justify-between font-normal text-slate-500">
          <button type="button" onClick={() => { setText(sample); setProblem(''); }} className="font-semibold text-orange-800 underline">Use a sample</button>
          <span>{text.length.toLocaleString('en-IN')} characters</span>
        </span>
      </label>
      {(problem || error) && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">
          {problem || error}
          {!problem && text.trim() && <button type="button" onClick={() => { const fixed = relaxJson(text); setText(fixed); onLoad(fixed, ''); }} className="ml-2 font-semibold underline">Remove comments and trailing commas and try again</button>}
        </div>
      )}
      <MainActionButton onClick={() => { if (!text.trim()) { setProblem('Paste some JSON or choose a file first.'); return; } onLoad(text, ''); }} disabled={reading}>{actionLabel}</MainActionButton>
    </div>
  );
};
