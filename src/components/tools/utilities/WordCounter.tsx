import React, { useMemo, useState } from 'react';
import { Stat, StatGrid, calcCard } from '../../finance/ui';
import { CopyButton, fieldClass } from './common';
import { analyzeText, textExtras } from '../../../lib/utilities/text';

const minutes = (value: number) => (value === 0 ? '0 sec' : value < 1 ? `${Math.max(1, Math.round(value * 60))} sec` : `${value.toFixed(1)} min`);
const LIMITS = [
  { label: 'X (Twitter) post', max: 280 }, { label: 'SMS (one message)', max: 160 }, { label: 'Meta description (SEO)', max: 160 },
  { label: 'Page title (SEO)', max: 60 }, { label: 'Instagram caption', max: 2200 }, { label: 'LinkedIn post', max: 3000 },
];

export const WordCounter: React.FC = () => {
  const [text, setText] = useState('');
  const stats = useMemo(() => analyzeText(text), [text]);
  const extras = useMemo(() => textExtras(text), [text]);
  return (
    <section className={calcCard}>
      <label className="block text-xs font-semibold text-slate-700">
        Your text
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} placeholder="Type or paste your text here" className={`${fieldClass} resize-y font-normal leading-relaxed`} />
      </label>
      <StatGrid>
        <Stat label="Words" value={stats.words.toLocaleString('en-IN')} tone="strong" />
        <Stat label="Characters" value={stats.characters.toLocaleString('en-IN')} />
        <Stat label="Characters (no spaces)" value={stats.charactersNoSpaces.toLocaleString('en-IN')} />
        <Stat label="Sentences" value={stats.sentences.toLocaleString('en-IN')} />
        <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString('en-IN')} />
        <Stat label="Reading time" value={minutes(stats.readingMinutes)} tone="good" />
        <Stat label="Speaking time" value={minutes(stats.speakingMinutes)} />
        <Stat label="Unique words" value={extras.uniqueWords.toLocaleString('en-IN')} />
        <Stat label="Average word length" value={extras.averageWordLength ? `${extras.averageWordLength.toFixed(1)} letters` : '0'} />
        <Stat label="Longest word" value={extras.longestWord || '—'} />
      </StatGrid>
      {extras.topWords.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Most used words (common words skipped)</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {extras.topWords.map((item) => <li key={item.word} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{item.word} <strong>{item.count}</strong></li>)}
          </ul>
        </div>
      )}
      <div className="mt-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Common length limits (characters)</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {LIMITS.map((limit) => {
            const over = stats.characters > limit.max;
            return (
              <li key={limit.label} className="text-xs text-slate-700">
                <div className="flex justify-between"><span>{limit.label}</span><span className={over ? 'font-bold text-red-700' : 'font-semibold'}>{stats.characters} / {limit.max}{over ? ` (${stats.characters - limit.max} over)` : ''}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (stats.characters / limit.max) * 100)}%` }} /></div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setText('')} disabled={!text} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Clear</button>
        <CopyButton text={text} label="Copy text" />
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Counted in your browser; your text is never uploaded. Reading time assumes 200 words a minute, speaking 130. SMS limits differ for non-English characters.</p>
    </section>
  );
};

export default WordCounter;
