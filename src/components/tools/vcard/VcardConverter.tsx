import React, { useMemo, useRef, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { VCardParser, type Contact } from '../../../lib/vcard/parser';
import { readVcf } from '../../../lib/vcard/read';
import { GROUP_LABELS, buildTable, defaultOptions, type FieldGroup, type TableOptions } from '../../../lib/vcard/table';
import { SHEET_ROWS, toCsvBlob, toXlsxBlob } from '../../../lib/vcard/export';

const PREVIEW_ROWS = 15;

const save = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const formatSize = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

export const VcardConverter: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [files, setFiles] = useState<{ name: string; size: number; cards: number }[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [progress, setProgress] = useState<{ name: string; fraction: number } | null>(null);
  const [options, setOptions] = useState<TableOptions>(defaultOptions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const parserRef = useRef(new VCardParser());

  const table = useMemo(() => buildTable(contacts, options), [contacts, options]);
  const withPhone = useMemo(() => contacts.filter((c) => c.phones.length > 0).length, [contacts]);
  const withEmail = useMemo(() => contacts.filter((c) => c.emails.length > 0).length, [contacts]);
  const setOption = <K extends keyof TableOptions>(key: K, value: TableOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));
  const toggleGroup = (group: FieldGroup) => setOptions((current) => ({ ...current, groups: { ...current.groups, [group]: !current.groups[group] } }));

  const addFiles = async (picked: File[]) => {
    setMessage('');
    setBusy(true);
    const parser = parserRef.current;
    try {
      for (const file of picked) {
        const before = parser.contacts.length;
        setProgress({ name: file.name, fraction: 0 });
        await readVcf(file, parser, (fraction) => setProgress({ name: file.name, fraction }));
        setFiles((current) => [...current, { name: file.name, size: file.size, cards: parser.contacts.length - before }]);
      }
      setContacts([...parser.contacts]);
      setSkipped(parser.skipped);
      if (parser.contacts.length === 0) setMessage('No contacts were found. Check that the file is a .vcf (vCard) file.');
    } catch {
      setMessage('Could not read that file. If it is very large, close other tabs and try again, or split it into parts.');
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  const clear = () => { parserRef.current = new VCardParser(); setContacts([]); setFiles([]); setSkipped(0); setMessage(''); };

  const exportAs = async (kind: 'csv' | 'xlsx') => {
    setBusy(true);
    setMessage('');
    try {
      await new Promise((resolve) => { window.setTimeout(resolve, 0); });
      const blob = kind === 'csv' ? toCsvBlob(table, options.protectPhones) : await toXlsxBlob(table);
      save(blob, `contacts.${kind}`);
    } catch {
      setMessage('Could not build the file. Try turning off some columns, or use CSV for very large lists.');
    } finally {
      setBusy(false);
    }
  };

  const hasData = contacts.length > 0;

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={card}>
        <h2 className={heading}>1. Choose your vCard files</h2>
        <p className="mt-1 text-[11px] text-slate-500">One or several .vcf files, from a phone, Google, iCloud or Outlook. Large files are read in pieces, so a file of hundreds of megabytes will not freeze the page. Nothing is uploaded.</p>
        <div className="mt-3">
          <FileDropZone accept=".vcf,.vcard,text/vcard,text/x-vcard" multiple onFiles={(picked) => void addFiles(picked)} disabled={busy} />
        </div>
        {progress && (
          <div className="mt-3" role="status">
            <p className="text-xs text-slate-700">Reading {progress.name}: {Math.round(progress.fraction * 100)}%</p>
            <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100"><div className="h-full bg-orange-600" style={{ width: `${progress.fraction * 100}%` }} /></div>
          </div>
        )}
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-slate-700">
            {files.map((file, i) => <li key={`${file.name}-${i}`}>{file.name} · {formatSize(file.size)} · {file.cards.toLocaleString()} contacts</li>)}
          </ul>
        )}
        {message && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{message}</p>}
      </div>

      {hasData && (<>
        <div className={card}>
          <h2 className={heading}>2. Contacts found</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[['Contacts', contacts.length], ['With a phone', withPhone], ['With an email', withEmail], ['Duplicates removed', table.duplicates]].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-slate-50 px-2 py-3"><dd className="text-lg font-bold text-slate-900">{Number(value).toLocaleString()}</dd><dt className="text-[11px] text-slate-500">{label}</dt></div>
            ))}
          </dl>
          {skipped > 0 && <p className="mt-2 text-[11px] text-slate-500">{skipped.toLocaleString()} empty cards (no name, company, phone or email) were left out.</p>}
        </div>

        <div className={card}>
          <h2 className={heading}>3. Columns and clean-up</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(Object.keys(GROUP_LABELS) as FieldGroup[]).map((group) => <Toggle key={group} label={GROUP_LABELS[group]} checked={options.groups[group]} onChange={() => toggleGroup(group)} />)}
          </div>
          <div className="mt-4 space-y-3">
            <ChoiceButtons label="When a contact has several phones, emails or addresses" value={options.multiple} onChange={(value) => setOption('multiple', value as TableOptions['multiple'])} options={[{ value: 'columns', label: 'Separate columns' }, { value: 'cell', label: 'All in one cell' }]} />
            <Toggle label="Remove duplicates" checked={options.removeDuplicates} onChange={(value) => setOption('removeDuplicates', value)} hint="Drops a card whose name, phones and emails are all already on another card, and keeps the fullest one" />
            <Toggle label="Tidy phone numbers" checked={options.cleanPhones} onChange={(value) => setOption('cleanPhones', value)} hint="Removes spaces, dashes and brackets and keeps a leading +" />
            <Toggle label="Sort by last name" checked={options.sort} onChange={(value) => setOption('sort', value)} />
            <Toggle label="Keep + and leading zeros when a CSV is opened in Excel" checked={options.protectPhones} onChange={(value) => setOption('protectPhones', value)} hint='Writes phone numbers as ="+123". Useful only for CSV opened in Excel; leave off if the CSV goes to another system. An Excel (.xlsx) file does not need it.' />
          </div>
        </div>

        <div className={card}>
          <h2 className={heading}>4. Preview and download</h2>
          <p className="mt-1 text-[11px] text-slate-500">{table.rows.length.toLocaleString()} rows and {table.headers.length} columns. First {Math.min(PREVIEW_ROWS, table.rows.length)} rows shown.</p>
          <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-slate-100"><tr>{table.headers.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-bold text-slate-700">{h}</th>)}</tr></thead>
              <tbody>{table.rows.slice(0, PREVIEW_ROWS).map((row, r) => <tr key={r} className="border-t border-slate-100">{row.map((value, c) => <td key={c} className="max-w-48 truncate whitespace-nowrap px-2 py-1 text-slate-800" title={value}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {table.rows.length > SHEET_ROWS && <p className="mt-2 text-[11px] text-amber-800">Excel holds about one million rows per sheet, so the .xlsx file will be split across several sheets. CSV is a single file.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy || table.headers.length === 0} onClick={() => void exportAs('xlsx')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Working...' : 'Download Excel (.xlsx)'}</button>
            <button type="button" disabled={busy || table.headers.length === 0} onClick={() => void exportAs('csv')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />Download CSV</button>
            <button type="button" disabled={busy} onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Start over</button>
          </div>
        </div>
      </>)}
      <Note>Your contacts are read and converted on this device. They are never uploaded. Embedded photos are skipped to keep files small.</Note>
    </section>
  );
};

export default VcardConverter;
