import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import { PdfFileBar } from '../../common/PdfFileBar';
import { useProtectedPdf } from '../../common/ProtectedPdfGate';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { usePdfPageCount } from '../../../lib/pdf/pageCount';
import { generateFileName } from '../../../lib/pdf/naming';
import { formatBytes } from '../../../lib/browserTools';
import { useResultFile } from '../../../lib/useResultFile';
import { buildTable, type GridOptions } from '../../../lib/pdftable/grid';
import { MAX_PAGES, readPieces, type PagePieces } from '../../../lib/pdftable/read';
import { toCsv, toXlsx } from '../../../lib/pdftable/write';
import { makeSamplePdf } from '../../../lib/pdftable/sample';
import ui from '../../../locales/packs/pdftable.ui.en.json';
import starters from '../../../locales/packs/pdftable.examples.en.json';
import { buttonClass } from '../../common/styles';

type StarterId = 'bank' | 'marks' | 'invoice' | 'pages';
const STARTER_IDS: StarterId[] = ['bank', 'marks', 'invoice', 'pages'];
type OutputId = 'xlsx' | 'csv';
const PREVIEW_ROWS = 25;

/** Turn the table inside a PDF into an Excel or CSV file. Works on PDFs that have real text, such as bank statements, marksheets and invoices. Everything happens on your device. */
export const PdfTableToExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pieces, setPieces] = useState<PagePieces[] | null>(null);
  const [options, setOptions] = useState<GridOptions>({ merge: true, dropHeaders: true, joinWrapped: true, numbers: true, skipIntro: false });
  const [starter, setStarter] = useState<StarterId | ''>('');
  const [output, setOutput] = useState<OutputId>('xlsx');
  const [reading, setReading] = useState<{ page: number; total: number } | null>(null);
  const [message, setMessage] = useState('');
  const [truncated, setTruncated] = useState(false);
  const cancelled = useRef(false);
  const result = useResultFile();
  const { openWithPassword, dialog: passwordDialog } = useProtectedPdf();
  const pageTotal = usePdfPageCount(file);

  useEffect(() => () => { cancelled.current = true; }, []);

  const table = useMemo(() => (pieces ? buildTable(pieces, options) : null), [pieces, options]);
  const hasText = !!pieces && pieces.some((page) => page.pieces.length > 0);

  const open = async (selected: File, typed = '') => {
    cancelled.current = false; result.clear(); setMessage(''); setPieces(null); setFile(selected); setReading({ page: 0, total: 1 }); setTruncated(false);
    try {
      const found = await readPieces(await selected.arrayBuffer(), typed || undefined, (page, total) => setReading({ page, total }), () => cancelled.current);
      if (found) { setPieces(found); setTruncated((pageTotal ?? 0) > MAX_PAGES); }
    } catch { setMessage(ui.failed); } finally { setReading(null); }
  };
  const reset = () => { cancelled.current = true; setFile(null); setPieces(null); setMessage(''); setReading(null); result.clear(); };
  const change = (patch: Partial<GridOptions>) => { result.clear(); setStarter(''); setOptions((current) => ({ ...current, ...patch })); };
  const pickStarter = (id: StarterId) => { const s = starters[id]; result.clear(); setStarter(id); setOptions((current) => ({ ...current, merge: s.merge, dropHeaders: s.dropHeaders, joinWrapped: s.joinWrapped, skipIntro: s.skipIntro })); };
  const trySample = async () => { cancelled.current = true; await new Promise((resolve) => setTimeout(resolve, 0)); pickStarter('bank'); void open(await makeSamplePdf()); };

  const save = async () => {
    if (!table || !file) return;
    const blob = output === 'xlsx' ? await toXlsx(table.sheets) : toCsv(table.sheets);
    result.set(blob, generateFileName('table', output, { base: file.name }), { key: output, detail: ui.detail.replace('{rows}', String(table.rows)).replace('{size}', formatBytes(blob.size)) });
  };

  const firstSheet = table?.sheets[0];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {passwordDialog}
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <ChoiceButtons label={ui.starters} value={starter} onChange={(value) => pickStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
        <p className="text-[11px] text-slate-500">{starter ? starters[starter].hint : ui.startersHint}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.file}</h2>
        {!file ? (
          <>
            <p className="text-[11px] text-slate-500">{ui.fileHint}</p>
            <FileDropZone accept=".pdf,application/pdf" showSample={false} onFiles={(files) => { void openWithPassword(files[0]).then((opened) => { if (opened) void open(opened.file, opened.password); }); }} />
            <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => void trySample()} className={buttonClass}>{ui.trySample}</button><span className="text-[11px] text-slate-500">{ui.sampleNote}</span></div>
          </>
        ) : (
          <PdfFileBar name={file.name} size={file.size} pages={pageTotal} onChange={reset} />
        )}
        {reading && (<div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((reading.page / Math.max(1, reading.total)) * 100)}%` }} /></div><div className="flex items-center justify-between gap-2"><p className="text-xs text-slate-700">{ui.reading.replace('{page}', String(Math.max(1, reading.page))).replace('{total}', String(reading.total))}</p><button type="button" onClick={() => { cancelled.current = true; setReading(null); setFile(null); }} className="text-xs font-bold text-slate-700 underline">{ui.stop}</button></div></div>)}
        {message && <Note>{message}</Note>}
        {pieces && !hasText && <Note>{ui.noText}</Note>}
        {truncated && <Note>{ui.tooLong.replace('{max}', String(MAX_PAGES))}</Note>}
      </section>

      {table && hasText && (
        <>
          <section className={`${card} space-y-3`}>
            <h2 className={heading}>{ui.preview}</h2>
            <p className="text-xs font-semibold text-slate-800">{ui.summary.replace('{rows}', String(table.rows)).replace('{columns}', String(table.columns)).replace('{pages}', String(table.pages))}</p>
            {!table.foundColumns && <Note>{ui.noTable}</Note>}
            {!options.merge && table.sheets.length > 1 && <p className="text-[11px] text-slate-500">{ui.sheetsNote.replace('{sheets}', String(table.sheets.length))}</p>}
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <tbody>
                  {(firstSheet?.rows ?? []).slice(0, PREVIEW_ROWS).map((row, r) => (
                    <tr key={r} className={r === 0 ? 'bg-slate-100 font-bold' : r % 2 ? 'bg-slate-50' : 'bg-white'}>
                      {row.map((cell, c) => <td key={c} className={`whitespace-nowrap px-2 py-1.5 text-slate-900 ${typeof cell === 'number' ? 'text-right tabular-nums' : ''}`}>{String(cell)}</td>)}
                    </tr>))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">{ui.previewHint}</p>
          </section>

          <section className={card}>
            <details>
              <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
              <div className="mt-3 space-y-3">
                <Toggle label={ui.merge} hint={ui.mergeHint} checked={options.merge} onChange={(value) => change({ merge: value })} />
                <Toggle label={ui.dropHeaders} checked={options.dropHeaders} onChange={(value) => change({ dropHeaders: value })} />
                <Toggle label={ui.joinWrapped} hint={ui.joinHint} checked={options.joinWrapped} onChange={(value) => change({ joinWrapped: value })} />
                <Toggle label={ui.skipIntro} hint={ui.skipHint} checked={options.skipIntro} onChange={(value) => change({ skipIntro: value })} />
                <Toggle label={ui.numbers} hint={ui.numbersHint} checked={options.numbers} onChange={(value) => change({ numbers: value })} />
                <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={output} onChange={(value) => { result.clear(); setOutput(value as OutputId); }} options={[{ value: 'xlsx', label: ui.outputs.xlsx }, { value: 'csv', label: ui.outputs.csv }]} /><p className="mt-1 text-[11px] text-slate-500">{ui.outputHint}</p></div>
              </div>
            </details>
          </section>

          <section className={`${card} space-y-3`}>
            <MainActionButton onClick={() => void save()}><FileText className="h-5 w-5" aria-hidden="true" />{ui.make.replace('{type}', output === 'xlsx' ? 'Excel' : 'CSV')}</MainActionButton>
            {result.result && <SaveResult href={result.result.url} name={result.result.name} label={ui.ready} saveLabel={result.result.key === 'csv' ? ui.saveCsv : ui.saveXlsx} detail={result.result.detail} />}
            {result.result && <StartOverButton onClick={reset}>{ui.another}</StartOverButton>}
            <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
          </section>
        </>
      )}
    </div>
  );
};

export default PdfTableToExcel;
