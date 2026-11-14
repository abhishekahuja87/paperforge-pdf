import React, { useMemo, useState } from 'react';
import { Download, Shuffle } from 'lucide-react';
import { Note } from '../../../finance/ui';
import { card, heading } from '../../paper/controls';
import { fieldClass } from '../../utilities/common';
import { makeBook, type TambolaTicket } from '../../../../lib/kids/tambola';
import { TAMBOLA_THEMES, buildTambolaPdf, pdfSafe } from '../../../../lib/kids/tambolaPdf';
import { generateFileName } from '../../../../lib/pdf/naming';

const COLOURS: Record<string, string> = { orange: '#ea580c', blue: '#1d4ed8', green: '#15803d', pink: '#db2777', purple: '#6d28d9' };

const Ticket: React.FC<{ ticket: TambolaTicket; number: number; colour: string }> = ({ ticket, number, colour }) => (
  <div className="overflow-hidden rounded-md border-2" style={{ borderColor: colour }}>
    <div className="px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: colour }}>Ticket {number}</div>
    <div className="grid grid-cols-9">
      {ticket.flatMap((row, r) => row.map((value, c) => (
        <div key={`${r}-${c}`} className="flex h-8 items-center justify-center border text-sm font-black tabular-nums text-slate-900 sm:h-9" style={{ borderColor: `${colour}99`, background: value === null ? `${colour}1f` : '#fff' }}>{value}</div>
      )))}
    </div>
  </div>
);

export const TicketMaker: React.FC = () => {
  const [books, setBooks] = useState(1);
  const [title, setTitle] = useState('Tambola');
  const [footer, setFooter] = useState('');
  const [theme, setTheme] = useState('orange');
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Tickets are made fresh whenever the number of sheets changes or "New tickets" is pressed.
  const made = useMemo(() => Array.from({ length: books }, () => makeBook()), [books, seed]);
  const colour = COLOURS[theme] ?? COLOURS.orange;
  const cleaned = pdfSafe(title) !== title.trim() || pdfSafe(footer) !== footer.trim();

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const bytes = await buildTambolaPdf(made, { title, footer, theme });
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('tambola-tickets', 'pdf', { base: pdfSafe(title) || 'tambola', details: `${books * 6}-tickets` });
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMessage('The PDF could not be created. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Note>Each sheet has 6 tickets that use every number from 1 to 90 exactly once, like a printed tambola book. Every ticket has 15 numbers, 5 in each row. Make as many sheets as you need: each one is different.</Note>
      <div className={card}>
        <h3 className={heading}>Your tickets</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Title on top
            <input className={fieldClass} value={title} maxLength={40} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Line at the bottom (optional)
            <input className={fieldClass} value={footer} maxLength={60} placeholder="For example, Hosted by the Sharma family" onChange={(event) => setFooter(event.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Number of sheets
            <select className={fieldClass} value={books} onChange={(event) => setBooks(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} sheet{n > 1 ? 's' : ''} ({n * 6} tickets)</option>)}
            </select>
          </label>
          <div className="text-xs font-semibold text-slate-700">
            Colour
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label="Ticket colour">
              {TAMBOLA_THEMES.map((item) => (
                <button key={item.id} type="button" onClick={() => setTheme(item.id)} aria-pressed={theme === item.id} aria-label={item.label}
                  className={`h-10 w-10 rounded-full border-4 ${theme === item.id ? 'border-slate-900' : 'border-white shadow'}`} style={{ background: COLOURS[item.id] }} />
              ))}
            </div>
          </div>
        </div>
        {cleaned && <p className="mt-2 text-[11px] text-amber-800">The printed sheet can show English letters, numbers and common symbols only. Other letters will be left out of the PDF.</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setSeed((value) => value + 1)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Shuffle className="h-4 w-4" aria-hidden="true" />New tickets</button>
          <button type="button" onClick={download} disabled={busy} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Making the PDF…' : `Download PDF (${books} page${books > 1 ? 's' : ''})`}</button>
        </div>
        {message && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{message}</p>}
      </div>

      <div className={card}>
        <h3 className={heading}>Preview: sheet 1 of {books}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {made[0].map((ticket, index) => <Ticket key={index} ticket={ticket} number={index + 1} colour={colour} />)}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">The PDF is A4, one sheet per page, with the title, the prize line and ticket numbers added.</p>
      </div>
    </div>
  );
};
