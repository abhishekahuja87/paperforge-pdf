import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, Printer, Trash2, Upload } from 'lucide-react';
import { calcCard } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { downloadBlob } from '../../../lib/browserTools';
import {
  analyseResume, coerceResume, emptyResume, newEducation, newExperience, newProject, sampleResume,
  type ResumeData, type ResumeEducation, type ResumeExperience, type ResumeProject,
} from '../../../lib/careers/resume';
import { PAPER, ResumePreview, type ResumeStyle } from './ResumePreview';

const STORAGE_KEY = 'mdu.resume.v1';
const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900';

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; multiline?: boolean; rows?: number; hint?: string }> = ({ label, value, onChange, type = 'text', placeholder, multiline, rows = 3, hint }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{label}</label>
      {multiline
        ? <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
        : <input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};

const IconButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ label, onClick, disabled, children }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40">{children}</button>
);

const move = <T,>(items: T[], index: number, by: number): T[] => {
  const target = index + by;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const Group: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <fieldset className="rounded-xl border border-slate-200 p-4">
    <legend className="px-1 text-sm font-bold text-slate-900">{title}</legend>
    <div className="space-y-4">{children}</div>
    {action}
  </fieldset>
);

const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" onClick={onClick} className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>
);

function readSaved(): { resume: ResumeData; style: ResumeStyle } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { resume?: unknown; style?: Partial<ResumeStyle> };
    const style: ResumeStyle = { template: parsed.style?.template === 'modern' ? 'modern' : 'classic', accent: /^#[0-9a-f]{6}$/i.test(parsed.style?.accent ?? '') ? (parsed.style?.accent as string) : '#1d4ed8', size: parsed.style?.size === 'compact' || parsed.style?.size === 'large' ? parsed.style.size : 'normal', paper: parsed.style?.paper === 'letter' ? 'letter' : 'a4' };
    return { resume: coerceResume(parsed.resume), style };
  } catch {
    return null;
  }
}

export const ResumeBuilder: React.FC = () => {
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [style, setStyle] = useState<ResumeStyle>({ template: 'classic', accent: '#1d4ed8', size: 'normal', paper: 'a4' });
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState(1);
  const [scale, setScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const paper = PAPER[style.paper];
  const check = analyseResume(resume);

  useEffect(() => {
    const saved = readSaved();
    if (saved) { setResume(saved.resume); setStyle(saved.style); setRemember(true); }
  }, []);

  useEffect(() => {
    try {
      if (remember) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ resume, style }));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable: the resume still works for this visit */ }
  }, [remember, resume, style]);

  useLayoutEffect(() => {
    const height = previewRef.current?.scrollHeight ?? 0;
    setPages(Math.max(1, Math.ceil((height - 4) / paper.height)));
  }, [resume, style, paper.height]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => setScale(Math.min(1, frame.clientWidth / paper.width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paper.width]);

  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => setResume((current) => ({ ...current, [key]: value }));
  const patch = <T extends { id: string }>(key: 'experience' | 'education' | 'projects', id: string, change: Partial<T>) =>
    setResume((current) => ({ ...current, [key]: (current[key] as unknown as T[]).map((item) => (item.id === id ? { ...item, ...change } : item)) }));
  const shift = (key: 'experience' | 'education' | 'projects', index: number, by: number) => setResume((current) => ({ ...current, [key]: move(current[key] as unknown[], index, by) }));
  const remove = (key: 'experience' | 'education' | 'projects', id: string) => setResume((current) => ({ ...current, [key]: (current[key] as { id: string }[]).filter((item) => item.id !== id) }));

  const exportJson = () => downloadBlob(new Blob([JSON.stringify({ resume, style }, null, 2)], { type: 'application/json' }), 'resume-data.json');
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { resume?: unknown };
      setResume(coerceResume(parsed.resume ?? parsed));
      setMessage('Resume loaded from the file.');
    } catch {
      setMessage('That file could not be read. Choose a file saved with "Save data file".');
    }
    if (importRef.current) importRef.current.value = '';
  };
  const clearAll = () => { setResume(emptyResume()); setMessage('Cleared. Your saved copy in this browser is also removed unless you keep "Remember" ticked.'); };

  const experience = resume.experience;
  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #resume-print, #resume-print * { visibility: visible !important; } #resume-scale { transform: none !important; height: auto !important; width: auto !important; } #resume-print { position: absolute; left: 0; top: 0; width: 100% !important; min-height: 0 !important; border: 0 !important; box-shadow: none !important; } #resume-print > div { padding: 0 !important; } @page { size: ${style.paper === 'letter' ? 'letter' : 'A4'}; margin: 14mm 16mm; } }`}</style>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:hidden">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setResume(sampleResume()); setMessage('Example loaded. Replace it with your own details.'); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Load an example</button>
            <button type="button" onClick={clearAll} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear everything</button>
            <button type="button" onClick={exportJson} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-3.5 w-3.5" aria-hidden="true" />Save data file</button>
            <button type="button" onClick={() => importRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Upload className="h-3.5 w-3.5" aria-hidden="true" />Open data file</button>
            <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Open a saved resume data file" onChange={(event) => void importJson(event.target.files?.[0])} />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
            <span><strong>Remember my resume in this browser.</strong> It is kept only on this device and never uploaded. Untick it to delete the saved copy. Do not tick it on a shared computer.</span>
          </label>
          {message && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">{message}</p>}

          <Group title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={resume.name} onChange={(value) => set('name', value)} />
              <Field label="Job title or headline" value={resume.headline} onChange={(value) => set('headline', value)} placeholder="e.g. Accounts Executive" />
              <Field label="Email" type="email" value={resume.email} onChange={(value) => set('email', value)} />
              <Field label="Phone" type="tel" value={resume.phone} onChange={(value) => set('phone', value)} />
              <Field label="City, country" value={resume.location} onChange={(value) => set('location', value)} />
              <Field label="Links (one per line)" multiline rows={2} value={resume.links} onChange={(value) => set('links', value)} placeholder="linkedin.com/in/yourname" />
            </div>
            <Field label="Summary" multiline rows={4} value={resume.summary} onChange={(value) => set('summary', value)} hint="Two or three lines: who you are, what you are good at, what you want next." />
          </Group>

          <Group title="Work experience" action={<AddButton label="Add a job" onClick={() => set('experience', [...experience, newExperience()])} />}>
            {experience.map((item: ResumeExperience, index) => (
              <div key={item.id} className="space-y-3 rounded-lg bg-slate-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job title" value={item.role} onChange={(value) => patch<ResumeExperience>('experience', item.id, { role: value })} />
                  <Field label="Company" value={item.company} onChange={(value) => patch<ResumeExperience>('experience', item.id, { company: value })} />
                  <Field label="Start" type="month" value={item.start} onChange={(value) => patch<ResumeExperience>('experience', item.id, { start: value })} />
                  <Field label="End" type="month" value={item.end} onChange={(value) => patch<ResumeExperience>('experience', item.id, { end: value })} />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={item.current} onChange={(event) => patch<ResumeExperience>('experience', item.id, { current: event.target.checked })} className="h-4 w-4 accent-orange-600" />I work here now</label>
                <Field label="City" value={item.location} onChange={(value) => patch<ResumeExperience>('experience', item.id, { location: value })} />
                <Field label="What you did (one bullet per line)" multiline rows={4} value={item.bullets} onChange={(value) => patch<ResumeExperience>('experience', item.id, { bullets: value })} hint="Start each line with a verb and add numbers where you honestly can." />
                <div className="flex gap-2">
                  <IconButton label="Move this job up" onClick={() => shift('experience', index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Move this job down" onClick={() => shift('experience', index, 1)} disabled={index === experience.length - 1}><ArrowDown className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Remove this job" onClick={() => remove('experience', item.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></IconButton>
                </div>
              </div>
            ))}
          </Group>

          <Group title="Education" action={<AddButton label="Add education" onClick={() => set('education', [...resume.education, newEducation()])} />}>
            {resume.education.map((item: ResumeEducation, index) => (
              <div key={item.id} className="space-y-3 rounded-lg bg-slate-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Degree or course" value={item.degree} onChange={(value) => patch<ResumeEducation>('education', item.id, { degree: value })} />
                  <Field label="School or college" value={item.school} onChange={(value) => patch<ResumeEducation>('education', item.id, { school: value })} />
                  <Field label="Start (year or month)" value={item.start} onChange={(value) => patch<ResumeEducation>('education', item.id, { start: value })} placeholder="2018" />
                  <Field label="End (year or month)" value={item.end} onChange={(value) => patch<ResumeEducation>('education', item.id, { end: value })} placeholder="2021" />
                  <Field label="City" value={item.location} onChange={(value) => patch<ResumeEducation>('education', item.id, { location: value })} />
                  <Field label="Result or note (optional)" value={item.details} onChange={(value) => patch<ResumeEducation>('education', item.id, { details: value })} />
                </div>
                <div className="flex gap-2">
                  <IconButton label="Move this entry up" onClick={() => shift('education', index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Move this entry down" onClick={() => shift('education', index, 1)} disabled={index === resume.education.length - 1}><ArrowDown className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Remove this entry" onClick={() => remove('education', item.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></IconButton>
                </div>
              </div>
            ))}
          </Group>

          <Group title="Projects (optional)" action={<AddButton label="Add a project" onClick={() => set('projects', [...resume.projects, newProject()])} />}>
            {resume.projects.map((item: ResumeProject, index) => (
              <div key={item.id} className="space-y-3 rounded-lg bg-slate-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project name" value={item.name} onChange={(value) => patch<ResumeProject>('projects', item.id, { name: value })} />
                  <Field label="Link (optional)" value={item.link} onChange={(value) => patch<ResumeProject>('projects', item.id, { link: value })} />
                </div>
                <Field label="What it is and what you did (one bullet per line)" multiline rows={3} value={item.details} onChange={(value) => patch<ResumeProject>('projects', item.id, { details: value })} />
                <div className="flex gap-2">
                  <IconButton label="Move this project up" onClick={() => shift('projects', index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Move this project down" onClick={() => shift('projects', index, 1)} disabled={index === resume.projects.length - 1}><ArrowDown className="h-4 w-4" aria-hidden="true" /></IconButton>
                  <IconButton label="Remove this project" onClick={() => remove('projects', item.id)}><Trash2 className="h-4 w-4" aria-hidden="true" /></IconButton>
                </div>
              </div>
            ))}
          </Group>

          <Group title="Skills and certifications">
            <Field label="Skills (separate with commas or new lines)" multiline rows={3} value={resume.skills} onChange={(value) => set('skills', value)} />
            <Field label="Certifications (one per line)" multiline rows={2} value={resume.certifications} onChange={(value) => set('certifications', value)} />
          </Group>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            <ChoiceButtons label="Layout" value={style.template} onChange={(value) => setStyle((current) => ({ ...current, template: value === 'modern' ? 'modern' : 'classic' }))} options={[{ value: 'classic', label: 'Classic (serif, centred)' }, { value: 'modern', label: 'Modern (sans-serif, colour)' }]} />
            <ChoiceButtons label="Text size" value={style.size} onChange={(value) => setStyle((current) => ({ ...current, size: value === 'compact' || value === 'large' ? value : 'normal' }))} options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }]} />
            <ChoiceButtons label="Paper" value={style.paper} onChange={(value) => setStyle((current) => ({ ...current, paper: value === 'letter' ? 'letter' : 'a4' }))} options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'US Letter' }]} />
            {style.template === 'modern' && (
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700">Accent colour
                <input type="color" value={style.accent} onChange={(event) => setStyle((current) => ({ ...current, accent: event.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
              </label>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Resume checklist <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{check.score}/100</span></h3>
            <p className="mt-1 text-[11px] text-slate-500">A guide to what recruiters and resume parsers commonly look for. It is not a real applicant tracking system, and a high number does not guarantee shortlisting.</p>
            <ul className="mt-2 space-y-1.5" aria-live="polite">
              {check.findings.map((item, index) => (
                <li key={index} className={`rounded-lg px-3 py-1.5 text-xs ${item.level === 'fix' ? 'bg-rose-50 text-rose-800' : item.level === 'warn' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>
                  <strong>{item.level === 'fix' ? 'Fix: ' : item.level === 'warn' ? 'Improve: ' : 'Good: '}</strong>{item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button>
            <p className="text-xs text-slate-600" aria-live="polite">Estimated length: <strong>{pages} page{pages === 1 ? '' : 's'}</strong>{pages > 1 ? ' (try Compact text or fewer bullets for one page)' : ''}</p>
          </div>
          <p className="text-[11px] text-slate-500">In the print window choose "Save as PDF" as the destination, set margins to Default and turn off "Headers and footers". The PDF keeps real, selectable text.</p>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-bold text-slate-900 print:hidden">Preview</h2>
      <div ref={frameRef} className="mt-2 overflow-hidden rounded-xl border border-slate-300 bg-slate-100 print:border-0 print:bg-white">
        <div id="resume-scale" style={{ width: paper.width, transform: `scale(${scale})`, transformOrigin: 'top left', height: scale < 1 ? (previewRef.current?.scrollHeight ?? paper.height) * scale : undefined }}>
          <div id="resume-print" ref={previewRef} style={{ width: paper.width, minHeight: paper.height, background: '#fff' }}>
            <ResumePreview resume={resume} style={style} />
          </div>
        </div>
      </div>
      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 print:hidden">Your resume is built in your browser and is not uploaded. It is only kept on this device if you tick "Remember my resume".</p>
    </section>
  );
};

export default ResumeBuilder;
