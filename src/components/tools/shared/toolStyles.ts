/** Button and chip styles shared by the sports and fitness tools. Orange for actions, never blue. */
export const chipClass = (on: boolean): string => `min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50';
export const ghostButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-300 px-4 py-2 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50';
export const smallInput = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900';
