import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Undo2, Volume2, VolumeX } from 'lucide-react';
import { card, heading } from '../../paper/controls';
import { NICKNAMES, spokenNumber } from '../../../../lib/kids/tambola';

const STORAGE_KEY = 'mdu-tambola-v1';

function loadCalled(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<number>();
    return parsed.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 90 && !seen.has(n) && Boolean(seen.add(n)));
  } catch { return []; }
}

export const NumberCaller: React.FC = () => {
  const [called, setCalled] = useState<number[]>(loadCalled);
  const [speak, setSpeak] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const spoken = useRef(called.length);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(called)); } catch { /* storage unavailable */ }
  }, [called]);

  const latest = called[called.length - 1];
  useEffect(() => {
    // Read out a number only when a new one is called, not when the page opens.
    if (!speak || !canSpeak || called.length <= spoken.current || latest === undefined) { spoken.current = called.length; return; }
    spoken.current = called.length;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenNumber(latest));
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [called, latest, speak, canSpeak]);

  const callNext = useCallback(() => {
    setConfirmReset(false);
    setCalled((current) => {
      if (current.length >= 90) return current;
      const left = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !current.includes(n));
      return [...current, left[Math.floor(Math.random() * left.length)]];
    });
  }, []);

  const undo = () => { setCalled((current) => current.slice(0, -1)); setConfirmReset(false); };
  const reset = () => { if (!confirmReset) { setConfirmReset(true); return; } setCalled([]); setConfirmReset(false); };

  const done = called.length >= 90;
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-orange-500 bg-orange-50 sm:h-56 sm:w-56" aria-live="polite" aria-atomic="true">
            <span className="text-8xl font-black tabular-nums text-slate-900 sm:text-9xl">{latest ?? '–'}</span>
          </div>
          <p className="mt-3 min-h-7 text-lg font-bold text-orange-800">{latest !== undefined ? (NICKNAMES[latest] ?? '') : 'Press the button to call the first number'}</p>
          <p className="text-xs text-slate-600">{called.length} of 90 called{done ? ' · All numbers have been called' : ''}</p>
          <button type="button" onClick={callNext} disabled={done} className="mt-4 inline-flex min-h-16 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-orange-700 px-6 py-4 text-xl font-black text-white hover:bg-orange-800 active:scale-[0.99] disabled:opacity-50">
            <Mic className="h-6 w-6" aria-hidden="true" />Call next number
          </button>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={undo} disabled={called.length === 0} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><Undo2 className="h-4 w-4" aria-hidden="true" />Undo last</button>
            <button type="button" onClick={reset} disabled={called.length === 0} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 ${confirmReset ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}><RotateCcw className="h-4 w-4" aria-hidden="true" />{confirmReset ? 'Tap again to start a new game' : 'New game'}</button>
            {canSpeak && (
              <button type="button" onClick={() => setSpeak((value) => !value)} aria-pressed={speak} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold ${speak ? 'border-orange-600 bg-orange-50 text-orange-900' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
                {speak ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}{speak ? 'Voice on' : 'Voice off'}
              </button>
            )}
          </div>
        </div>
      </div>

      {called.length > 1 && (
        <div className={card}>
          <h3 className={heading}>Last numbers called</h3>
          <p className="mt-2 flex flex-wrap gap-2">
            {called.slice(-8, -1).reverse().map((n) => <span key={n} className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-slate-100 px-2 text-lg font-black tabular-nums text-slate-800">{n}</span>)}
          </p>
        </div>
      )}

      <div className={card}>
        <h3 className={heading}>The board</h3>
        <p className="mt-1 text-[11px] text-slate-500">Called numbers are filled in, so anyone can check a claim.</p>
        <ol className="mt-2 grid list-none grid-cols-10 gap-1 p-0" aria-label="Board of numbers 1 to 90">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
            const on = called.includes(n);
            return <li key={n} className={`flex h-8 items-center justify-center rounded text-xs font-bold tabular-nums sm:h-10 sm:text-sm ${n === latest ? 'bg-orange-600 text-white ring-2 ring-orange-300' : on ? 'bg-orange-200 text-orange-950' : 'bg-slate-100 text-slate-500'}`} aria-label={`${n}${on ? ', called' : ''}`}>{n}</li>;
          })}
        </ol>
      </div>
    </div>
  );
};
