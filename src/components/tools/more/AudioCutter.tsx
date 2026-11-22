import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { FileDropZone } from '../../common/FileDropZone';
import { UploadNote } from '../../common/UploadNote';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { formatFileSize } from '../../../lib/pdf/fileName';
import { useResultFile } from '../../../lib/useResultFile';
import { generateFileName } from '../../../lib/pdf/naming';
import { applyFades, encodeWav, formatTime, joinChannels, normalise, parseTime, peaks, sliceChannels, toStereo, type Channels } from '../../../lib/more/audio';

const RATE = 44100;
const MAX_SECONDS = 30 * 60;
type AudioContextClass = typeof AudioContext;
const contextClass = (): AudioContextClass | undefined => (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext);
interface Clip { id: number; file: File; channels: Channels; seconds: number }

/** Join audio files and cut out the part you want, with fades. Plays and saves in your browser as a WAV file. No limit on files or length beyond your device. */
export const AudioCutter: React.FC = () => {
  const saved = useResultFile();
  const [clips, setClips] = useState<Clip[]>([]);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState('');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [startText, setStartText] = useState('0:00.0');
  const [endText, setEndText] = useState('0:00.0');
  const [fade, setFade] = useState('0');
  const [loud, setLoud] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const more = useRef<HTMLInputElement>(null);
  const player = useRef<{ context: AudioContext; source: AudioBufferSourceNode } | null>(null);
  const nextId = useRef(1);

  const joined = useMemo(() => (clips.length ? joinChannels(clips.map((clip) => clip.channels)) : null), [clips]);
  const total = joined ? joined[0]!.length / RATE : 0;
  const settingsKey = JSON.stringify([clips.map((clip) => `${clip.id}`), start, end, fade, loud]);
  const outdated = saved.isOutdated(settingsKey);

  const stop = () => { try { player.current?.source.stop(); void player.current?.context.close(); } catch { /* already stopped */ } player.current = null; setPlaying(false); };
  useEffect(() => stop, []);

  // New total length: select everything again.
  useEffect(() => { stop(); setStart(0); setEnd(total); setStartText(formatTime(0)); setEndText(formatTime(total)); }, [total]);

  const addFiles = async (chosen: File[]) => {
    const Context = contextClass();
    if (!Context) { setMessage('This browser cannot read audio files. Try a recent Chrome, Edge, Firefox or Safari.'); return; }
    setReading(true); setMessage(''); saved.clear();
    const added: Clip[] = []; const failed: string[] = [];
    let seconds = clips.reduce((sum, clip) => sum + clip.seconds, 0);
    for (const file of chosen) {
      const context = new Context({ sampleRate: RATE });
      try {
        const buffer = await context.decodeAudioData(await file.arrayBuffer());
        if (seconds + buffer.duration > MAX_SECONDS) { failed.push(`${file.name} (too long to fit in memory; the limit is 30 minutes in total)`); continue; }
        seconds += buffer.duration;
        const channels = toStereo(Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index).slice()));
        added.push({ id: nextId.current++, file, channels, seconds: buffer.duration });
      } catch { failed.push(file.name); } finally { void context.close(); }
    }
    if (added.length) setClips((list) => [...list, ...added]);
    if (failed.length) setMessage(`Could not read: ${failed.join(', ')}. Use a normal audio file such as MP3, M4A, WAV, OGG or a voice note.`);
    setReading(false);
  };

  const move = (index: number, by: number) => { saved.clear(); setClips((list) => { const next = [...list]; const to = index + by; if (to < 0 || to >= next.length) return list; [next[index], next[to]] = [next[to]!, next[index]!]; return next; }); };
  const startOver = () => { stop(); saved.clear(); setClips([]); setMessage(''); };

  const setRange = (nextStart: number, nextEnd: number) => {
    const a = Math.max(0, Math.min(nextStart, total)); const b = Math.max(a, Math.min(nextEnd, total));
    stop(); setStart(a); setEnd(b); setStartText(formatTime(a)); setEndText(formatTime(b));
  };
  const commitText = (text: string, which: 'start' | 'end') => {
    const seconds = parseTime(text);
    if (seconds === null) { setStartText(formatTime(start)); setEndText(formatTime(end)); return; }
    if (which === 'start') setRange(seconds, Math.max(seconds, end)); else setRange(Math.min(start, seconds), seconds);
  };

  // Draw the wave with the chosen part highlighted.
  useEffect(() => {
    const element = canvas.current;
    if (!element || !joined) return;
    const width = element.clientWidth || 600; const height = 96;
    element.width = width * 2; element.height = height * 2;
    const context = element.getContext('2d');
    if (!context) return;
    context.scale(2, 2);
    context.clearRect(0, 0, width, height);
    const bars = peaks(joined[0]!, Math.floor(width / 3));
    const from = total ? (start / total) * width : 0; const to = total ? (end / total) * width : width;
    context.fillStyle = 'rgba(234,88,12,0.14)'; context.fillRect(from, 0, Math.max(1, to - from), height);
    bars.forEach((peak, index) => {
      const x = index * 3; const h = Math.max(2, peak * (height - 8));
      context.fillStyle = x >= from && x <= to ? '#c2410c' : '#a8a29e';
      context.fillRect(x, (height - h) / 2, 2, h);
    });
  }, [joined, start, end, total]);

  const result = (): Channels | null => {
    if (!joined) return null;
    let part = sliceChannels(joined, RATE, start, end);
    if (Number(fade) > 0) part = applyFades(part, RATE, Number(fade), Number(fade));
    return loud ? normalise(part) : part;
  };

  const togglePlay = () => {
    if (playing) { stop(); return; }
    const Context = contextClass(); const part = result();
    if (!Context || !part || part[0]!.length === 0) return;
    const context = new Context({ sampleRate: RATE });
    const buffer = context.createBuffer(2, part[0]!.length, RATE);
    buffer.copyToChannel(part[0]! as Float32Array<ArrayBuffer>, 0); buffer.copyToChannel(part[1]! as Float32Array<ArrayBuffer>, 1);
    const source = context.createBufferSource();
    source.buffer = buffer; source.connect(context.destination);
    source.onended = () => { if (player.current?.source === source) stop(); };
    source.start();
    player.current = { context, source }; setPlaying(true);
  };

  const save = () => {
    const part = result();
    if (!part || part[0]!.length === 0) { setMessage('Choose a part longer than zero seconds.'); return; }
    setBusy(true); setMessage('');
    window.setTimeout(() => {
      try {
        const wav = encodeWav(part, RATE);
        saved.set(new Blob([wav as BlobPart], { type: 'audio/wav' }), generateFileName(clips.length > 1 ? 'joined-audio' : 'cut-audio', 'wav', { base: clips[0]?.file.name }), { key: settingsKey, detail: `${formatTime(part[0]!.length / RATE)} long, ${formatFileSize(wav.length)}` });
      } catch { setMessage('Could not make the audio file. Choose a shorter part and try again.'); } finally { setBusy(false); }
    }, 20);
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {clips.length === 0 && <UploadNote>Add one or more audio files. Join them, then choose the part to keep. Nothing is uploaded.</UploadNote>}
      {clips.length === 0 ? (
        <FileDropZone accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.opus,.flac,.amr" multiple readingPdf={reading} disabled={reading} onFiles={(files) => { void addFiles(files); }} />
      ) : (
        <div className="space-y-2">
          <ol className="space-y-1">
            {clips.map((clip, index) => (
              <li key={clip.id} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700">
                <span className="min-w-0 flex-1 break-all">{index + 1}. {clip.file.name} <span className="text-stone-400">({formatTime(clip.seconds)}, {formatFileSize(clip.file.size)})</span></span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${clip.file.name} up`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === clips.length - 1} aria-label={`Move ${clip.file.name} down`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => { saved.clear(); setClips((list) => list.filter((item) => item.id !== clip.id)); }} aria-label={`Remove ${clip.file.name}`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-red-700 hover:bg-stone-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <input ref={more} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.opus,.flac,.amr" multiple className="hidden" onChange={(event) => { const list = Array.from(event.target.files ?? []); event.target.value = ''; if (list.length) void addFiles(list); }} />
            <button type="button" disabled={reading} onClick={() => more.current?.click()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden="true" />{reading ? 'Reading…' : 'Add more audio'}</button>
            <button type="button" onClick={startOver} className="inline-flex min-h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50">Change files</button>
          </div>
        </div>
      )}

      {joined && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Choose the part to keep</h2>
          <canvas ref={canvas} role="img" aria-label="Sound wave. The part you keep is highlighted." className="h-24 w-full rounded-lg bg-stone-50" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700">Start<input value={startText} onChange={(event) => setStartText(event.target.value)} onBlur={(event) => commitText(event.target.value, 'start')} onKeyDown={(event) => { if (event.key === 'Enter') commitText(startText, 'start'); }} inputMode="decimal" className={fieldClass} /></label>
            <label className="text-xs font-semibold text-slate-700">End<input value={endText} onChange={(event) => setEndText(event.target.value)} onBlur={(event) => commitText(event.target.value, 'end')} onKeyDown={(event) => { if (event.key === 'Enter') commitText(endText, 'end'); }} inputMode="decimal" className={fieldClass} /></label>
          </div>
          <label className="block text-xs font-semibold text-slate-700">Start point<input type="range" min={0} max={total} step={0.1} value={start} onChange={(event) => setRange(Number(event.target.value), Math.max(Number(event.target.value), end))} className="mt-1 w-full accent-orange-700" /></label>
          <label className="block text-xs font-semibold text-slate-700">End point<input type="range" min={0} max={total} step={0.1} value={end} onChange={(event) => setRange(Math.min(start, Number(event.target.value)), Number(event.target.value))} className="mt-1 w-full accent-orange-700" /></label>
          <p className="text-xs text-slate-700">Keeping <span className="font-bold text-slate-900">{formatTime(Math.max(0, end - start))}</span> of {formatTime(total)}.</p>
          <ChoiceButtons label="Fade in and out" value={fade} onChange={setFade} options={[{ value: '0', label: 'No fade' }, { value: '0.5', label: '0.5 s' }, { value: '1', label: '1 s' }, { value: '2', label: '2 s' }, { value: '3', label: '3 s' }]} />
          <Toggle label="Make it as loud as possible without distortion" checked={loud} onChange={setLoud} />
          <button type="button" onClick={togglePlay} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50">{playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? 'Stop' : 'Play the part you keep'}</button>
        </div>
      )}
      {joined && (!saved.result || outdated) && <MainActionButton onClick={save} busy={busy} busyLabel="Making the file...">{clips.length > 1 ? 'Join and cut audio' : 'Cut audio'}</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your audio is ready" saveLabel="Save WAV" detail={saved.result.detail} outdated={outdated} />
          {!outdated && <audio controls src={saved.result.url} className="w-full" />}
          {!outdated && <StartOverButton onClick={startOver}>Start with other audio</StartOverButton>}
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default AudioCutter;
