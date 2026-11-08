import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { InputGrid, NumberField, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';
import { loremParagraphs } from '../../../lib/utilities/dev';

export const LoremIpsumGenerator: React.FC = () => {
  const [paragraphs, setParagraphs] = useState('3');
  const [sentences, setSentences] = useState('4');
  const [startLorem, setStartLorem] = useState(true);
  const [format, setFormat] = useState('text');
  const [seed, setSeed] = useState(0);

  const text = useMemo(() => {
    void seed;
    const count = Math.max(1, Math.min(50, Math.floor(Number(paragraphs)) || 1));
    const per = Math.max(1, Math.min(20, Math.floor(Number(sentences)) || 1));
    const list = loremParagraphs(count, per, startLorem);
    return format === 'html' ? list.map((paragraph) => `<p>${paragraph}</p>`).join('\n') : list.join('\n\n');
  }, [paragraphs, sentences, startLorem, format, seed]);
  const words = text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Paragraphs (1 to 50)" value={paragraphs} onChange={setParagraphs} step="1" />
        <NumberField label="Sentences per paragraph (1 to 20)" value={sentences} onChange={setSentences} step="1" />
      </InputGrid>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={startLorem} onChange={(event) => setStartLorem(event.target.checked)} className="h-4 w-4" />Start with &quot;Lorem ipsum dolor sit amet&quot;</label>
        <ChoiceButtons label="Output format" value={format} onChange={setFormat} options={[{ value: 'text', label: 'Plain text' }, { value: 'html', label: 'HTML paragraphs' }]} />
      </div>
      <label className="mt-4 block text-xs font-semibold text-slate-700">Generated text ({words} words)<textarea readOnly value={text} rows={10} className={`${fieldClass} resize-y bg-slate-50 font-normal leading-relaxed`} /></label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setSeed((current) => current + 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Generate again</button>
        <CopyButton text={text} label="Copy text" />
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Placeholder text made in your browser from a small word list. It is only for layouts and mock-ups; it has no meaning.</p>
    </section>
  );
};

export default LoremIpsumGenerator;
