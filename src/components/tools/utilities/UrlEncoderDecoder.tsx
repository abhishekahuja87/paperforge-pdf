import React, { useMemo, useState } from 'react';
import { SimpleTable, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';

export const UrlEncoderDecoder: React.FC = () => {
  const [mode, setMode] = useState('encode');
  const [scope, setScope] = useState('component');
  const [input, setInput] = useState('');

  const { output, error } = useMemo(() => {
    try {
      if (mode === 'encode') return { output: scope === 'component' ? encodeURIComponent(input) : encodeURI(input), error: '' };
      return { output: scope === 'component' ? decodeURIComponent(input.replace(/\+/g, ' ')) : decodeURI(input), error: '' };
    } catch {
      return { output: '', error: 'This text is not valid percent-encoding, for example a % that is not followed by two hex digits.' };
    }
  }, [mode, scope, input]);

  const params = useMemo(() => {
    const target = mode === 'decode' ? output : input;
    try {
      const url = new URL(target.trim());
      const rows = Array.from(url.searchParams.entries()).map(([key, value]) => [key, value]);
      return { host: url.host, path: url.pathname, rows };
    } catch { return null; }
  }, [mode, input, output]);

  return (
    <section className={calcCard}>
      <div className="flex flex-wrap gap-4">
        <ChoiceButtons label="Direction" value={mode} onChange={setMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
        <ChoiceButtons label="What you are converting" value={scope} onChange={setScope} options={[{ value: 'component', label: 'A value or query part' }, { value: 'full', label: 'A whole URL' }]} />
      </div>
      <label className="mt-4 block text-xs font-semibold text-slate-700">{mode === 'encode' ? 'Text to encode' : 'Encoded text to decode'}<textarea value={input} onChange={(event) => setInput(event.target.value)} rows={5} className={`${fieldClass} resize-y font-mono font-normal`} /></label>
      {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}
      <label className="mt-4 block text-xs font-semibold text-slate-700">Result<textarea readOnly value={output} rows={5} className={`${fieldClass} resize-y bg-slate-50 font-mono font-normal`} /></label>
      <div className="mt-3"><CopyButton text={output} label="Copy result" /></div>
      {params && params.rows.length > 0 && <SimpleTable caption={`Query parameters for ${params.host}${params.path}`} head={['Parameter', 'Value']} rows={params.rows} />}
      <p className="mt-4 text-xs text-slate-500">&quot;A value or query part&quot; also encodes characters like / ? &amp; = so the text is safe inside a query string. &quot;A whole URL&quot; keeps those characters so the link still works. When decoding a value, + is read as a space.</p>
      <p className="mt-2 text-center text-[10px] text-slate-400">Converted in your browser; your text is never uploaded.</p>
    </section>
  );
};

export default UrlEncoderDecoder;
