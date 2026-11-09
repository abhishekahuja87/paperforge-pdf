import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleAlert, CircleX } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import { InputGrid, Note, NumberField, SelectField, calcCard } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { cleanFileName, evaluateFile, extensionOf, kindOf, worstLevel, type FileCheck, type FileInfo, type FileLimits } from '../../../lib/careers/fileCheck';
import { probePdf } from '../../../lib/pdf/probe';

interface Report { id: string; info: FileInfo; unreadable: boolean }

const ACTIONS: Record<NonNullable<FileCheck['action']>, { to: string; text: string }> = {
  'compress-pdf': { to: '/compress-pdf', text: 'Compress this PDF' },
  'unlock-pdf': { to: '/unlock-pdf', text: 'Remove the password' },
  'split-pdf': { to: '/split-pdf', text: 'Keep only the pages you need' },
  'image-resizer': { to: '/image-resizer', text: 'Resize this image to a target size' },
  'digitize-documents': { to: '/digitize-documents', text: 'Make it searchable' },
};

const ICON = {
  pass: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />,
  warn: <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />,
  fail: <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />,
} as const;
const LABEL = { pass: 'Ready', warn: 'Check', fail: 'Needs fixing' } as const;

function readImage(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    image.src = url;
  });
}

async function describe(file: File): Promise<Report> {
  const extension = extensionOf(file.name);
  const info: FileInfo = { name: file.name, size: file.size, extension, kind: kindOf(extension, file.type) };
  let unreadable = false;
  try {
    if (info.kind === 'pdf') Object.assign(info, await probePdf(await file.arrayBuffer()));
    else if (info.kind === 'image') Object.assign(info, await readImage(file));
  } catch {
    unreadable = true;
  }
  return { id: `${file.name}-${file.size}-${file.lastModified}`, info, unreadable };
}

/** Most files checked in one go; more are reported as skipped so nothing is dropped silently. */
const MAX_FILES = 100;

export const UploadFileChecker: React.FC = () => {
  const [limit, setLimit] = useState('200');
  const [unit, setUnit] = useState('kb');
  const [formats, setFormats] = useState('');
  const [maxPages, setMaxPages] = useState('');
  const [cleanName, setCleanName] = useState('yes');
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState(0);

  const limits: FileLimits = {
    maxBytes: Math.max(0, Number(limit) || 0) * (unit === 'mb' ? 1024 * 1024 : 1024),
    formats,
    maxPages: Math.max(0, Math.floor(Number(maxPages) || 0)),
    cleanName: cleanName === 'yes',
  };

  const addFiles = async (files: File[]) => {
    setBusy(true);
    const room = Math.max(0, MAX_FILES - reports.length);
    const next: Report[] = [];
    // A few at a time, so a big batch of PDFs does not load them all into memory at once.
    for (let i = 0; i < Math.min(files.length, room); i += 10) next.push(...await Promise.all(files.slice(i, Math.min(i + 10, room)).map(describe)));
    setReports((current) => [...current, ...next]);
    setSkipped(Math.max(0, files.length - room));
    setBusy(false);
  };

  return (
    <section className={calcCard}>
      <p className="mb-3 text-xs leading-relaxed text-slate-600">First enter what the form or recruiter asks for. Then add your files to see, before you upload, whether each one will be accepted. Files are read in your browser and are never uploaded.</p>
      <InputGrid>
        <NumberField label="Maximum file size" value={limit} onChange={setLimit} hint="Leave empty if there is no limit" />
        <SelectField label="Size unit" value={unit} onChange={setUnit} options={[{ value: 'kb', label: 'KB' }, { value: 'mb', label: 'MB' }]} />
        <div className="block text-xs font-semibold text-slate-700">
          <label htmlFor="file-formats">Accepted types (optional)</label>
          <input id="file-formats" value={formats} onChange={(event) => setFormats(event.target.value)} placeholder="pdf, jpg, png" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
          <span className="mt-1 block font-normal text-slate-500">Separate with commas. Empty accepts any type.</span>
        </div>
        <NumberField label="Maximum pages (optional)" value={maxPages} onChange={setMaxPages} step="1" hint="Applies to PDFs" />
      </InputGrid>
      <div className="mt-3">
        <ChoiceButtons label="Check the file name is simple and safe?" value={cleanName} onChange={setCleanName} options={[{ value: 'yes', label: 'Yes, check the name' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mt-4">
        <FileDropZone accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,application/pdf,image/*" multiple disabled={busy} label="Choose or drop the files to check" hint={`PDF, JPG, PNG, WebP, GIF or Word files, up to ${MAX_FILES} at a time. Nothing is uploaded.`} onFiles={(files) => void addFiles(files)} />
        {skipped > 0 && <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">The list is limited to {MAX_FILES} files, so {skipped} file{skipped === 1 ? ' was' : 's were'} not checked. Clear the list and add them again.</p>}
      </div>

      {reports.length > 0 && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Results for {reports.length} file{reports.length === 1 ? '' : 's'}</h3>
            <button type="button" onClick={() => { setReports([]); setSkipped(0); }} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100">Clear list</button>
          </div>
          {reports.map((report) => {
            const checks = report.unreadable
              ? ([{ level: 'fail', label: 'Readable', detail: 'This file could not be read. It may be damaged or not a real PDF or image.' }] as FileCheck[])
              : evaluateFile(report.info, limits);
            const worst = worstLevel(checks);
            return (
              <article key={report.id} className={`rounded-xl border p-4 ${worst === 'pass' ? 'border-emerald-200 bg-emerald-50/40' : worst === 'warn' ? 'border-amber-200 bg-amber-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="min-w-0 break-all text-sm font-bold text-slate-900">{report.info.name}</h4>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-700">{LABEL[worst]}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {checks.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-xs text-slate-800">
                      {ICON[item.level]}
                      <span><strong>{item.label}:</strong> {item.detail}{item.action && <> <Link to={ACTIONS[item.action].to} className="font-semibold text-indigo-700 underline">{ACTIONS[item.action].text}</Link></>}</span>
                    </li>
                  ))}
                </ul>
                {limits.cleanName && cleanFileName(report.info.name) !== report.info.name && (
                  <p className="mt-2 text-[11px] text-slate-600">Tip: rename it to <code className="rounded bg-white px-1">{cleanFileName(report.info.name)}</code> before uploading.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
      <Note>This checks the file itself against the limits you typed. It cannot know the rules of a particular website, so always follow the size, type and name rules written on the form you are filling in.</Note>
    </section>
  );
};

export default UploadFileChecker;
