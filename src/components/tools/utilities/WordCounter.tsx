import React, { useMemo, useState } from 'react';
import { Stat, StatGrid, calcCard } from '../../finance/ui';
import { CopyButton, fieldClass } from './common';
import { analyzeText } from '../../../lib/utilities/text';

const minutes = (value: number) => (value === 0 ? '0 sec' : value < 1 ? `${Math.max(1, Math.round(value * 60))} sec` : `${value.toFixed(1)} min`);

export const WordCounter: React.FC = () => {
  const [text, setText] = useState('');
  const stats = useMemo(() => analyzeText(text), [text]);
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
      </StatGrid>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setText('')} disabled={!text} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Clear</button>
        <CopyButton text={text} label="Copy text" />
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Counted in your browser; your text is never uploaded. Reading time assumes 200 words a minute, speaking 130.</p>
    </section>
  );
};

export default WordCounter;
