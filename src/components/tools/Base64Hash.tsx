import React, { useState } from 'react';
import { AlertCircle, Check, Clipboard, RotateCcw, ShieldCheck } from 'lucide-react';
import { copyText } from '../../lib/browserTools';
import { FileDropZone } from '../common/FileDropZone';

type ToolMode = 'encode' | 'decode' | 'hash';
type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type HashInput = 'text' | 'file';
const MAX_HASH_FILE_BYTES = 100 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function encodeUtf8(text: string, urlSafe: boolean): string {
  const encoded = bytesToBase64(new TextEncoder().encode(text));
  return urlSafe ? encoded.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '') : encoded;
}

function decodeUtf8(base64: string, urlSafe: boolean): string {
  const compact = base64.replace(/\s+/g, '');
  if (!compact) throw new Error('Enter Base64 text to decode.');
  const normalized = urlSafe ? compact.replaceAll('-', '+').replaceAll('_', '/') : compact;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || /=/.test(normalized.slice(0, -2))) {
    throw new Error('The input contains characters that are not valid Base64.');
  }
  const unpadded = normalized.replace(/=+$/g, '');
  if (unpadded.length % 4 === 1) throw new Error('The Base64 length is invalid.');
  const padded = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Could not decode this Base64 input. Check its characters and padding.');
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('This Base64 decodes to binary data, not valid UTF-8 text. Use a file decoder for binary content.');
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const Base64Hash: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hashInput, setHashInput] = useState<HashInput>('text');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const selectMode = (nextMode: ToolMode) => {
    setMode(nextMode);
    setOutput('');
    setError('');
    setStatus('');
    setIsCopied(false);
  };

  const run = async () => {
    setError('');
    setStatus('');
    setOutput('');
    setIsCopied(false);
    if (mode !== 'hash') {
      try {
        const result = mode === 'encode' ? encodeUtf8(input, urlSafe) : decodeUtf8(input, urlSafe);
        if (mode === 'encode' && !input) throw new Error('Enter text to encode.');
        setOutput(result);
        setStatus(mode === 'encode' ? 'Text encoded as UTF-8 Base64.' : 'Base64 decoded as UTF-8 text.');
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Base64 operation failed.');
      }
      return;
    }

    if (hashInput === 'text' && !input) {
      setError('Enter text to hash.');
      return;
    }
    if (hashInput === 'file' && !file) {
      setError('Choose a file to hash.');
      return;
    }
    if (hashInput === 'file' && file && file.size > MAX_HASH_FILE_BYTES) {
      setError('For browser memory safety, file hashing is limited to 100 MB. Try hashing the file in smaller parts or use a local desktop tool.');
      return;
    }
    if (!globalThis.crypto?.subtle) {
      setError('Secure browser cryptography is unavailable here. Open this page over HTTPS or localhost.');
      return;
    }
    setIsWorking(true);
    try {
      const data = hashInput === 'file' && file
        ? await file.arrayBuffer()
        : new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest(algorithm, data);
      setOutput(bytesToHex(new Uint8Array(digest)));
      setStatus(`${algorithm} fingerprint calculated locally${hashInput === 'file' && file ? ` for ${file.name}` : ''}.`);
    } catch (reason) {
      setError(reason instanceof Error ? `Hash calculation failed: ${reason.message}` : 'Hash calculation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const copyOutput = async () => {
    try {
      await copyText(output);
      setIsCopied(true);
      setStatus('Output copied to clipboard.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not copy the output.');
    }
  };

  const reset = () => {
    setInput('');
    setOutput('');
    setFile(null);
    setError('');
    setStatus('');
    setIsCopied(false);
  };

  return (
    <section className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
        {([
          ['encode', 'Encode Base64'],
          ['decode', 'Decode Base64'],
          ['hash', 'Hash / checksum'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => selectMode(value)} disabled={isWorking} aria-pressed={mode === value} className={`rounded-lg px-2 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${mode === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
        ))}
      </div>

      {mode === 'hash' && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">
            Hash this
            <select value={hashInput} disabled={isWorking} onChange={(event) => { setHashInput(event.target.value as HashInput); setOutput(''); setError(''); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="text">Text</option>
              <option value="file">A file</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Algorithm
            <select value={algorithm} disabled={isWorking} onChange={(event) => { setAlgorithm(event.target.value as HashAlgorithm); setOutput(''); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option>SHA-256</option>
              <option>SHA-384</option>
              <option>SHA-512</option>
              <option>SHA-1</option>
            </select>
          </label>
          {hashInput === 'file' && (
            <div className="sm:col-span-2">
              <FileDropZone
                disabled={isWorking}
                label={file ? `Change ${file.name}` : 'Choose a file or drop it here'}
                hint="Any file · up to 100 MB"
                onFiles={(files) => { setFile(files[0]); setOutput(''); setError(''); setStatus(''); }}
              />
            </div>
          )}
          {mode === 'hash' && hashInput === 'file' && <p className="mb-3 text-[10px] text-slate-500">Web Crypto reads the selected file into browser memory; files up to 100 MB are supported.</p>}
        </div>
      )}

      {(mode !== 'hash' || hashInput === 'text') && (
        <label className="block text-xs font-semibold text-slate-700">
          {mode === 'encode' ? 'Plain text (UTF-8)' : mode === 'decode' ? 'Base64 input' : 'Text to hash (UTF-8)'}
          <textarea value={input} disabled={isWorking} onChange={(event) => { setInput(event.target.value); setOutput(''); setError(''); setStatus(''); }} spellCheck={false} rows={7} placeholder={mode === 'encode' ? 'Enter text to encode...' : mode === 'decode' ? 'Paste Base64 text to decode...' : 'Enter text to hash...'} className="mt-1.5 w-full resize-y rounded-xl border border-stone-200 bg-white p-4 font-mono text-xs leading-relaxed text-stone-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          <span className="mt-1 block text-right font-normal text-slate-400">{input.length.toLocaleString()} characters</span>
        </label>
      )}

      {mode !== 'hash' && (
        <label className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <input type="checkbox" checked={urlSafe} onChange={(event) => { setUrlSafe(event.target.checked); setOutput(''); }} className="accent-indigo-600" />
          Use URL-safe Base64 (- and _ instead of + and /; omit padding when encoding)
        </label>
      )}

      <div className="mt-4 space-y-2">
        {(mode === 'hash' && hashInput === 'file' ? file !== null : input.length > 0) && <button type="button" onClick={() => void run()} disabled={isWorking} className="w-full rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50">
          {isWorking ? 'Calculating...' : mode === 'encode' ? 'Encode to Base64' : mode === 'decode' ? 'Decode Base64' : `Calculate ${algorithm}`}
        </button>}
        {(input || file || output || error || status) && <button type="button" onClick={reset} disabled={isWorking} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Clear</button>}
      </div>

      {output && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-700">{mode === 'hash' ? `${algorithm} digest (hex)` : mode === 'encode' ? 'Base64 output' : 'Decoded UTF-8 text'}
            <textarea readOnly value={output} rows={Math.min(10, Math.max(3, Math.ceil(output.length / 100)))} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800" />
          </label>
          <button type="button" onClick={() => void copyOutput()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}{isCopied ? 'Copied' : 'Copy output'}</button>
        </div>
      )}
      {status && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><ShieldCheck className="h-4 w-4 shrink-0" />{status}</p>}
      {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">Base64 is encoding, not encryption. SHA hashes are one-way fingerprints and cannot be reversed. All processing happens locally in your browser.</p>
    </section>
  );
};
