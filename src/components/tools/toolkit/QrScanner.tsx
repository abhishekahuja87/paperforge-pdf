import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Square } from 'lucide-react';
import { Note } from '../../finance/ui';
import { card, heading } from '../paper/controls';
import { CopyButton } from '../utilities/common';
import { CameraButton } from '../../common/CameraButton';
import { parseQr, type QrInfo } from '../../../lib/toolkit/qrParse';

interface Found { id: number; raw: string; info: QrInfo }
type ScannerInstance = { start: () => Promise<void>; stop: () => void; destroy: () => void };

/** Reads a QR code from a photo or the live camera and explains what is inside before anything is opened or paid. Everything stays on the device. */
export const QrScanner: React.FC = () => {
  const [found, setFound] = useState<Found[]>([]);
  const [message, setMessage] = useState('');
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<ScannerInstance | null>(null);
  const nextId = useRef(1);

  const remember = (raw: string) => {
    setFound((list) => {
      if (list.some((item) => item.raw === raw)) return list;
      const id = nextId.current; nextId.current += 1;
      return [{ id, raw, info: parseQr(raw) }, ...list];
    });
  };

  const stopLive = () => {
    scanner.current?.stop();
    scanner.current?.destroy();
    scanner.current = null;
    setLive(false);
  };
  useEffect(() => () => { scanner.current?.stop(); scanner.current?.destroy(); scanner.current = null; }, []);

  const fromPhoto = async (file: File | undefined) => {
    if (!file) return;
    setMessage(''); setBusy(true);
    try {
      if (!file.type.startsWith('image/')) throw new Error('type');
      const { default: QrScannerLib } = await import('qr-scanner');
      const result = await QrScannerLib.scanImage(file, { returnDetailedScanResult: true });
      remember(result.data);
    } catch (error) {
      setMessage(error instanceof Error && error.message === 'type' ? 'Choose a photo or screenshot (JPG, PNG or WebP).' : 'No QR code found in that picture. Hold the camera steady, fill the frame with the code, avoid glare, or try a clearer screenshot.');
    } finally { setBusy(false); }
  };

  const startLive = async () => {
    setMessage('');
    const element = video.current;
    if (!element) return;
    try {
      const { default: QrScannerLib } = await import('qr-scanner');
      if (!(await QrScannerLib.hasCamera())) { setMessage('No camera was found on this device. Choose a photo of the QR code instead.'); return; }
      const instance = new QrScannerLib(element, (result) => { remember(result.data); }, { returnDetailedScanResult: true, preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 8 });
      scanner.current = instance;
      await instance.start();
      setLive(true);
    } catch {
      scanner.current?.destroy(); scanner.current = null; setLive(false);
      setMessage('The camera could not start. Allow camera access for this site in your browser settings, or choose a photo of the QR code instead.');
    }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Scan the QR code</h2>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ImageUp className="h-4 w-4" aria-hidden="true" />Choose a photo or screenshot
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { void fromPhoto(event.target.files?.[0]); event.target.value = ''; }} />
          </label>
          <CameraButton onPhoto={(file) => void fromPhoto(file)} disabled={busy} />
          {!live ? (
            <button type="button" onClick={() => void startLive()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-900"><Camera className="h-4 w-4" aria-hidden="true" />Scan with live camera</button>
          ) : (
            <button type="button" onClick={stopLive} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800"><Square className="h-4 w-4" aria-hidden="true" />Stop camera</button>
          )}
        </div>
        <video ref={video} playsInline muted className={`${live ? 'block' : 'hidden'} aspect-square w-full max-w-sm rounded-xl bg-black object-cover`} />
        {busy && <p className="text-xs text-slate-600">Reading the picture…</p>}
        <p className="text-[11px] text-slate-500">The camera and pictures stay on your device. Nothing is uploaded. Live scanning needs a secure (https) page and your permission.</p>
      </div>

      {found.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. What the code says</h2>
          {found.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-bold text-slate-900">{item.info.title}</p>
              {item.info.details.length > 0 && (
                <dl>
                  {item.info.details.map((detail) => (
                    <div key={detail.label} className="flex gap-3 border-t border-slate-100 py-1.5 text-xs first:border-t-0">
                      <dt className="w-28 shrink-0 font-semibold text-slate-600">{detail.label}</dt>
                      <dd className="min-w-0 break-words text-slate-900">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-700"><span className="font-semibold">Full text: </span>{item.raw}</p>
              {item.info.warning && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{item.info.warning}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton text={item.raw} label="Copy text" />
                {item.info.href && <a href={item.info.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50">Open the link</a>}
              </div>
            </div>
          ))}
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default QrScanner;
