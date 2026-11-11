import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Printer } from 'lucide-react';
import { Note } from '../../finance/ui';
import { card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';
import { JD_MODES, JD_SECTION_ORDER, JD_TEMPLATES, JD_TYPES, DEFAULT_JD_TEMPLATE, SAMPLE_JD, getJdTemplate, isJdTemplateId, jdPlainText, type JdDetails, type JdSectionKey, type JdSections } from '../../../lib/hiring/jdTemplates';
import { generateFileName } from '../../../lib/pdf/naming';
import { JdPreview } from './JdPreview';

const STORAGE_KEY = 'mdu-job-description-v1';

interface Saved { details: JdDetails; template: string; accent: string; sections: JdSections; edited: Partial<Record<JdSectionKey, boolean>> }

function readSaved(): Saved {
  const template = getJdTemplate(DEFAULT_JD_TEMPLATE);
  const base: Saved = { details: SAMPLE_JD, template: template.id, accent: template.accent, sections: template.sections, edited: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Saved>;
    const id = isJdTemplateId(saved.template) ? saved.template : base.template;
    return {
      details: { ...SAMPLE_JD, ...(saved.details ?? {}) },
      template: id,
      accent: typeof saved.accent === 'string' && /^#[0-9a-f]{6}$/i.test(saved.accent) ? saved.accent : getJdTemplate(id).accent,
      sections: { ...getJdTemplate(id).sections, ...(saved.sections ?? {}) },
      edited: saved.edited ?? {},
    };
  } catch { return base; }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const textField: { key: keyof JdDetails; label: string; max: number }[] = [
  { key: 'title', label: 'Job title', max: 70 },
  { key: 'company', label: 'Company', max: 70 },
  { key: 'location', label: 'Location', max: 70 },
  { key: 'experience', label: 'Experience', max: 30 },
  { key: 'salary', label: 'Salary (optional)', max: 40 },
  { key: 'contact', label: 'Contact email or phone', max: 70 },
];

export const JobDescriptionBuilder: React.FC = () => {
  const initial = useMemo(readSaved, []);
  const [details, setDetails] = useState(initial.details);
  const [template, setTemplate] = useState(initial.template);
  const [accent, setAccent] = useState(initial.accent);
  const [sections, setSections] = useState(initial.sections);
  const [edited, setEdited] = useState(initial.edited);
  const [copied, setCopied] = useState(false);
  const spec = getJdTemplate(template);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ details, template, accent, sections, edited } satisfies Saved)); } catch { /* storage unavailable */ }
  }, [details, template, accent, sections, edited]);

  const pick = (id: string) => {
    const next = getJdTemplate(id);
    setTemplate(id);
    setAccent(next.accent);
    // Starter wording changes with the template, but anything you typed yourself stays.
    setSections((current) => Object.fromEntries(JD_SECTION_ORDER.map(({ key }) => [key, edited[key] ? current[key] : next.sections[key]])) as unknown as JdSections);
  };

  const setDetail = (key: keyof JdDetails, value: string) => setDetails((current) => ({ ...current, [key]: value }));
  const setSection = (key: JdSectionKey, value: string) => {
    setSections((current) => ({ ...current, [key]: value }));
    setEdited((current) => ({ ...current, [key]: true }));
  };

  const text = jdPlainText(details, sections);
  const base = details.title.trim() || 'job';

  const saveText = () => download(new Blob([text], { type: 'text/plain;charset=utf-8' }), generateFileName('job-description', 'txt', { base, details: template }));
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };
  const printPdf = () => {
    const previous = document.title;
    document.title = generateFileName('job-description', 'pdf', { base, details: template }).replace(/\.pdf$/, '');
    window.print();
    window.setTimeout(() => { document.title = previous; }, 1000);
  };

  const button = 'inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold';

  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden !important; } #jd-print, #jd-print * { visibility: visible !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } #jd-print { position: absolute; left: 0; top: 0; width: 100% !important; border: 0 !important; box-shadow: none !important; } @page { size: A4; margin: 12mm 8mm; } }`}</style>
      <div className="space-y-4 print:hidden">
        <Note>Everything is filled in with an example. Change the title and company, adjust the wording and download. Your text stays on your device.</Note>

        <div className={card}>
          <h3 className={heading}>1. The role</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {textField.map((field) => (
              <label key={field.key} className="block text-xs font-semibold text-slate-700">
                {field.label}
                <input className={fieldClass} value={details[field.key]} maxLength={field.max} onChange={(event) => setDetail(field.key, event.target.value)} />
              </label>
            ))}
            <label className="block text-xs font-semibold text-slate-700">
              Job type
              <select className={fieldClass} value={details.type} onChange={(event) => setDetail('type', event.target.value)}>{JD_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Where you work
              <select className={fieldClass} value={details.mode} onChange={(event) => setDetail('mode', event.target.value)}>{JD_MODES.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
          </div>
        </div>

        <div className={card}>
          <h3 className={heading}>2. Style and starter wording</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {JD_TEMPLATES.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => pick(item.id)} aria-pressed={item.id === template}
                  className={`h-full w-full rounded-lg border-2 p-2 text-left ${item.id === template ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="mb-1 block h-1.5 w-full rounded" style={{ background: item.accent }} />
                  <span className="block text-xs font-bold text-slate-900">{item.name}</span>
                  <span className="block text-[11px] leading-tight text-slate-500">{item.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-700">
            Colour
            <input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white" aria-label="Accent colour" />
            <button type="button" onClick={() => setAccent(spec.accent)} className="text-xs font-semibold text-orange-700 underline">Reset</button>
          </label>
          <p className="mt-2 text-[11px] text-slate-500">Picking a style loads its wording for the sections you have not edited. Sections you changed keep your text.</p>
        </div>

        <div className={card}>
          <h3 className={heading}>3. Sections</h3>
          <p className="mt-1 text-[11px] text-slate-500">Write one point per line. <code>{'{title}'}</code> and <code>{'{company}'}</code> are replaced with the role and company above. Empty sections are left out.</p>
          <div className="mt-3 space-y-3">
            {JD_SECTION_ORDER.map((section) => (
              <label key={section.key} className="block text-xs font-semibold text-slate-700">
                {section.label}
                <textarea className={`${fieldClass} font-normal`} rows={section.bullets ? 5 : 3} value={sections[section.key]} onChange={(event) => setSection(section.key, event.target.value)} />
              </label>
            ))}
          </div>
        </div>

        <div className={card}>
          <h3 className={heading}>Download</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={printPdf} className={`${button} bg-orange-700 text-white hover:bg-orange-800`}><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button>
            <button type="button" onClick={saveText} className={`${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}><Download className="h-4 w-4" aria-hidden="true" />Plain text (.txt)</button>
            <button type="button" onClick={copy} className={`${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? 'Copied' : 'Copy for job portals'}</button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">In the print window choose "Save as PDF" as the destination and turn off "Headers and footers". The plain text works for portals that do not accept formatting, such as Naukri, LinkedIn, WhatsApp or email.</p>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Preview</h3>
      </div>
      <div id="jd-print" className="mx-auto max-w-[794px] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <JdPreview spec={spec} accent={accent} details={details} sections={sections} />
      </div>
    </div>
  );
};

export default JobDescriptionBuilder;
