import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { InputGrid, NumberField, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';
import { loremParagraphs } from '../../../lib/utilities/dev';
import { englishParagraphs, randomCharacters, randomWords, type CharacterSets } from '../../../lib/utilities/randomText';

const clamp = (text: string, min: number, max: number) => Math.max(min, Math.min(max, Math.floor(Number(text)) || min));
const SEPARATORS: Record<string, string> = { space: ' ', line: '\n', comma: ', ' };

export const LoremIpsumGenerator: React.FC = () => {
  const [mode, setMode] = useState('lorem');
  const [paragraphs, setParagraphs] = useState('3');
  const [sentences, setSentences] = useState('4');
  const [startLorem, setStartLorem] = useState(true);
  const [format, setFormat] = useState('text');
  const [wordCount, setWordCount] = useState('50');
  const [separator, setSeparator] = useState('space');
  const [length, setLength] = useState('32');
  const [sets, setSets] = useState<CharacterSets>({ lower: true, upper: true, digits: true, symbols: false });
  const [seed, setSeed] = useState(0);

  const text = useMemo(() => {
    void seed;
    if (mode === 'words') return randomWords(clamp(wordCount, 1, 1000)).join(SEPARATORS[separator] ?? ' ');
    if (mode === 'characters') return randomCharacters(clamp(length, 1, 2000), sets);
    const count = clamp(paragraphs, 1, 50);
    const per = clamp(sentences, 1, 20);
    const list = mode === 'english' ? englishParagraphs(count, per) : loremParagraphs(count, per, startLorem);
    return format === 'html' ? list.map((paragraph) => `<p>${paragraph}</p>`).join('\n') : list.join('\n\n');
  }, [mode, paragraphs, sentences, startLorem, format, wordCount, separator, length, sets, seed]);
  const words = text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const paragraphMode = mode === 'lorem' || mode === 'english';
  const toggleSet = (key: keyof CharacterSets) => setSets((current) => ({ ...current, [key]: !current[key] }));

  return (
    <section className={calcCard}>
      <ChoiceButtons
        label="Type of text"
        value={mode}
        onChange={setMode}
        options={[{ value: 'lorem', label: 'Lorem ipsum' }, { value: 'english', label: 'Random sentences' }, { value: 'words', label: 'Random words' }, { value: 'characters', label: 'Random characters' }]}
      />

      {paragraphMode && (
        <>
          <InputGrid>
            <NumberField label="Paragraphs (1 to 50)" value={paragraphs} onChange={setParagraphs} step="1" />
            <NumberField label="Sentences per paragraph (1 to 20)" value={sentences} onChange={setSentences} step="1" />
          </InputGrid>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {mode === 'lorem' && (
              <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={startLorem} onChange={(event) => setStartLorem(event.target.checked)} className="h-4 w-4" />Start with &quot;Lorem ipsum dolor sit amet&quot;</label>
            )}
            <ChoiceButtons label="Output format" value={format} onChange={setFormat} options={[{ value: 'text', label: 'Plain text' }, { value: 'html', label: 'HTML paragraphs' }]} />
          </div>
        </>
      )}

      {mode === 'words' && (
        <div className="mt-3 space-y-3">
          <InputGrid>
            <NumberField label="Number of words (1 to 1000)" value={wordCount} onChange={setWordCount} step="1" />
          </InputGrid>
          <ChoiceButtons label="Separator" value={separator} onChange={setSeparator} options={[{ value: 'space', label: 'Spaces' }, { value: 'line', label: 'New lines' }, { value: 'comma', label: 'Commas' }]} />
        </div>
      )}

      {mode === 'characters' && (
        <div className="mt-3 space-y-3">
          <InputGrid>
            <NumberField label="Length (1 to 2000)" value={length} onChange={setLength} step="1" />
          </InputGrid>
          <div className="flex flex-wrap gap-4">
            {([['lower', 'a-z'], ['upper', 'A-Z'], ['digits', '0-9'], ['symbols', '!@#$']] as const).map(([key, label]) => (
              <label key={key} className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={sets[key]} onChange={() => toggleSet(key)} className="h-4 w-4" />{label}</label>
            ))}
          </div>
          {text === '' && <p role="status" className="text-xs text-amber-800">Tick at least one set of characters.</p>}
        </div>
      )}

      <label className="mt-4 block text-xs font-semibold text-slate-700">Generated text ({mode === 'characters' ? `${text.length} characters` : `${words} words`})<textarea readOnly value={text} rows={10} className={`${fieldClass} resize-y bg-slate-50 font-normal leading-relaxed`} /></label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setSeed((current) => current + 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Generate again</button>
        <CopyButton text={text} label="Copy text" />
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Text made in your browser. It is only for layouts, mock-ups and test data; it has no meaning. Random characters are not secure, so use the password generator for passwords.</p>
    </section>
  );
};

export default LoremIpsumGenerator;
