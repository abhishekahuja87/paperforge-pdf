import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Clock3,
  FileImage,
  FileText,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { renderDisplayFile } from '../../lib/display/render';
import type { DisplaySlide } from '../../lib/display/types';
import { FileDropZone } from '../common/FileDropZone';
import { useTranslation } from 'react-i18next';

type FitMode = 'contain' | 'cover' | 'fill';
type TransitionMode = 'none' | 'fade' | 'zoom';
type ClockPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const FILE_ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function formatTime(date: Date, use24Hour: boolean): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
  }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

const controlClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-45';
const selectClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export const DisplayStudio: React.FC<{ onHasSlidesChange?: (hasSlides: boolean) => void }> = ({ onHasSlidesChange }) => {
  const { t, i18n } = useTranslation();
  const [slides, setSlides] = useState<DisplaySlide[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [defaultDuration, setDefaultDuration] = useState(10);
  const [loop, setLoop] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [transition, setTransition] = useState<TransitionMode>('fade');
  const [background, setBackground] = useState('#111827');
  const [showClock, setShowClock] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [use24Hour, setUse24Hour] = useState(false);
  const [clockPosition, setClockPosition] = useState<ClockPosition>('top-right');
  const [showSlideCounter, setShowSlideCounter] = useState(true);
  const [requestWakeLock, setRequestWakeLock] = useState(true);
  const [wakeLockMessage, setWakeLockMessage] = useState('');
  const [playerOpen, setPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackOrder, setPlaybackOrder] = useState<string[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlPulse, setControlPulse] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const playerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onHasSlidesChange?.(slides.length > 0);
  }, [onHasSlidesChange, slides.length]);

  const includedSlides = useMemo(() => slides.filter((slide) => slide.included), [slides]);
  const currentIndex = playbackOrder.indexOf(currentSlideId ?? '');
  const currentSlide = slides.find((slide) => slide.id === currentSlideId);

  const updateSlide = (id: string, update: Partial<DisplaySlide>) => {
    setSlides((items) => items.map((slide) => (slide.id === id ? { ...slide, ...update } : slide)));
  };

  const addFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;
    setProcessing(true);
    setErrors([]);
    setNotice('');
    const addedSlides: DisplaySlide[] = [];
    const fileErrors: string[] = [];
    for (const file of selected) {
      if (file.size > MAX_FILE_BYTES) {
        fileErrors.push(`${file.name}: files must be 100 MB or smaller to help keep browser memory use manageable.`);
        continue;
      }
      try {
        addedSlides.push(...await renderDisplayFile(file));
      } catch (reason) {
        const detail = reason instanceof Error ? reason.message : 'The file could not be rendered.';
        fileErrors.push(`${file.name}: ${detail}`);
      }
    }
    if (addedSlides.length) {
      setSlides((items) => [...items, ...addedSlides]);
      setNotice(`Added ${addedSlides.length} ${addedSlides.length === 1 ? 'slide' : 'slides'} from ${selected.length - fileErrors.length} file${selected.length - fileErrors.length === 1 ? '' : 's'}.`);
    }
    setErrors(fileErrors);
    setProcessing(false);
  };

  const requestScreenWakeLock = async () => {
    if (!requestWakeLock) return;
    if (!navigator.wakeLock) {
      setWakeLockMessage('This browser does not support screen wake lock. Use your TV or device display settings to prevent sleep.');
      return;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        setWakeLockMessage('The browser released its screen-awake request. Your device may sleep according to its display settings.');
      });
      setWakeLockMessage('Screen-awake request is active while this tab remains visible. Device settings may still override it.');
    } catch {
      setWakeLockMessage('The browser could not keep the screen awake. Check your device display or power settings.');
    }
  };

  const releaseWakeLock = () => {
    const wakeLock = wakeLockRef.current;
    wakeLockRef.current = null;
    if (wakeLock) void wakeLock.release().catch(() => {
      setWakeLockMessage('Could not release the screen-awake request. It will end when the browser closes this player.');
    });
  };

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    setControlPulse((value) => value + 1);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const position = { x: event.clientX, y: event.clientY };
    const previous = lastPointerPosition.current;
    if (!previous) {
      lastPointerPosition.current = position;
      return;
    }
    if (Math.hypot(position.x - previous.x, position.y - previous.y) >= 10) {
      lastPointerPosition.current = position;
      revealControls();
    }
  };

  const advanceSlide = useCallback(() => {
    if (!playbackOrder.length || currentIndex < 0) return;
    if (currentIndex < playbackOrder.length - 1) {
      setCurrentSlideId(playbackOrder[currentIndex + 1]);
    } else if (loop) {
      const nextOrder = shuffle ? shuffled(playbackOrder) : playbackOrder;
      setPlaybackOrder(nextOrder);
      setCurrentSlideId(nextOrder[0]);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, loop, playbackOrder, shuffle]);

  const goToPrevious = useCallback(() => {
    if (!playbackOrder.length || currentIndex < 0) return;
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : loop ? playbackOrder.length - 1 : 0;
    setCurrentSlideId(playbackOrder[previousIndex]);
  }, [currentIndex, loop, playbackOrder]);

  const startShow = () => {
    const ids = includedSlides.map((slide) => slide.id);
    const order = shuffle ? shuffled(ids) : ids;
    setPlaybackOrder(order);
    setCurrentSlideId(order[0] ?? null);
    setPlayerOpen(true);
    setIsPlaying(true);
    setControlsVisible(true);
    lastPointerPosition.current = null;
    revealControls();
    setWakeLockMessage('');
    void requestScreenWakeLock();
  };

  const stopShow = () => {
    setIsPlaying(false);
    setPlayerOpen(false);
    releaseWakeLock();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {
      setWakeLockMessage('Could not exit fullscreen. Press Escape or use the browser fullscreen control.');
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch {
      setWakeLockMessage('Fullscreen could not be changed. Use F11 to enter or exit browser fullscreen.');
    }
  };

  const moveSlide = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= slides.length) return;
    setSlides((items) => {
      const reordered = [...items];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  };

  const removeSlide = (id: string) => {
    setSlides((items) => items.filter((slide) => slide.id !== id));
    setNotice('Slide removed from this show.');
  };

  const clearSlides = () => {
    setSlides([]);
    setNotice('The playlist and rendered files were cleared from this page.');
    setErrors([]);
  };

  useEffect(() => {
    if (!playerOpen || !isPlaying || !currentSlide) return undefined;
    const seconds = currentSlide.durationSeconds ?? defaultDuration;
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(advanceSlide, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [advanceSlide, currentSlide, defaultDuration, isPlaying, playerOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!playerOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName))) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        advanceSlide();
        revealControls();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goToPrevious();
        revealControls();
      } else if (event.key === ' ' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
        revealControls();
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceSlide, goToPrevious, playerOpen, revealControls]);

  useEffect(() => {
    if (!playerOpen || !isPlaying || !controlsVisible) return undefined;
    const timer = window.setTimeout(() => setControlsVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [controlPulse, controlsVisible, isPlaying, playerOpen]);

  useEffect(() => {
    if (!playerOpen || (!showClock && !showDate)) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [playerOpen, showClock, showDate]);

  useEffect(() => () => {
    if (wakeLockRef.current) void wakeLockRef.current.release().catch(() => undefined);
  }, []);

  const slideCount = includedSlides.length;
  const clockPositionClass: Record<ClockPosition, string> = {
    'top-left': 'left-4 top-4 sm:left-8 sm:top-8',
    'top-right': 'right-4 top-4 sm:right-8 sm:top-8',
    'bottom-left': 'bottom-20 left-4 sm:bottom-24 sm:left-8',
    'bottom-right': 'bottom-20 right-4 sm:bottom-24 sm:right-8',
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {playerOpen ? (
        <div
          ref={playerRef}
          className="relative flex h-[70vh] min-h-[420px] max-h-[850px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl [&:fullscreen]:h-screen [&:fullscreen]:max-h-none [&:fullscreen]:min-h-0 [&:fullscreen]:w-screen [&:fullscreen]:rounded-none"
          style={{ backgroundColor: background }}
          onPointerMove={handlePointerMove}
          onTouchStart={revealControls}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              if (isPlaying) setIsPlaying(false);
              else setIsPlaying(true);
              revealControls();
            }
          }}
        >
          {currentSlide ? (
            <img
              key={currentSlide.id}
              src={currentSlide.imageDataUrl}
              alt={currentSlide.caption || currentSlide.title}
              className={`h-full w-full ${transition === 'fade' ? 'display-slide-fade' : ''} ${transition === 'zoom' ? 'display-slide-zoom' : ''}`}
              style={{ objectFit: fitMode, maxHeight: '100vh' }}
            />
          ) : (
            <p className="px-6 text-center text-slate-300">No slides are available. Exit the player and add a file.</p>
          )}

          {(showClock || showDate) && (
            <div className={`pointer-events-none absolute z-10 rounded-xl bg-black/55 px-4 py-3 text-right text-white shadow-lg backdrop-blur-sm ${clockPositionClass[clockPosition]}`}>
              {showClock && <div className="text-2xl font-semibold tabular-nums sm:text-4xl">{formatTime(now, use24Hour)}</div>}
              {showDate && <div className="mt-1 text-xs font-medium sm:text-base">{formatDate(now)}</div>}
            </div>
          )}

          {wakeLockMessage && (
            <div role="status" className="absolute left-1/2 top-3 z-20 max-w-[85%] -translate-x-1/2 rounded-lg bg-black/65 px-3 py-2 text-center text-[11px] text-white shadow backdrop-blur-sm sm:top-5 sm:text-xs">
              {wakeLockMessage}
            </div>
          )}

          {currentSlide?.caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 bg-gradient-to-t from-black/75 to-transparent px-6 pb-3 pt-10 text-center text-lg font-semibold text-white sm:bottom-20 sm:text-2xl">
              {currentSlide.caption}
            </div>
          )}

          {showSlideCounter && currentSlide && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white sm:bottom-7 sm:left-8">
              {Math.max(0, currentIndex) + 1} / {playbackOrder.length}
            </div>
          )}

          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 sm:px-8 sm:pb-7 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
              <button type="button" className="rounded-full p-3 text-white hover:bg-white/15" onClick={goToPrevious} aria-label="Previous slide"><SkipBack className="h-5 w-5" /></button>
              <button type="button" className="rounded-full bg-white px-5 py-3 font-bold text-slate-900 hover:bg-indigo-100" onClick={() => setIsPlaying((value) => !value)}>
                {isPlaying ? <span className="inline-flex items-center gap-2"><Pause className="h-5 w-5" /> Pause</span> : <span className="inline-flex items-center gap-2"><Play className="h-5 w-5" /> Play</span>}
              </button>
              <button type="button" className="rounded-full p-3 text-white hover:bg-white/15" onClick={advanceSlide} aria-label="Next slide"><SkipForward className="h-5 w-5" /></button>
              <button type="button" className="rounded-full p-3 text-white hover:bg-white/15" onClick={() => setCurrentSlideId(playbackOrder[0] ?? null)} aria-label="Restart show"><RotateCcw className="h-5 w-5" /></button>
              <button type="button" className="rounded-full p-3 text-white hover:bg-white/15" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
              <button type="button" className="rounded-full p-3 text-white hover:bg-white/15" onClick={stopShow} aria-label="Close player"><X className="h-5 w-5" /></button>
            </div>
            {currentSlide && (
              <div className="mx-auto mt-3 max-w-3xl truncate text-center text-xs text-white/80">
                {currentSlide.title} · {isPlaying ? (currentSlide.durationSeconds === 0 ? 'Manual advance' : `Next in ${currentSlide.durationSeconds ?? defaultDuration}s`) : 'Paused'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={`mx-auto w-full rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 ${slides.length === 0 ? 'max-w-3xl' : ''}`}>
            <FileDropZone
              accept={FILE_ACCEPT}
              multiple
              disabled={processing}
              label={t(processing ? 'displayPage.preparing' : 'displayPage.choose')}
              hint={t('displayPage.hint')}
              labelLanguage={i18n.language}
              onFiles={(files) => { void addFiles(files); }}
            />
          </div>

          {errors.length > 0 && (
            <div role="alert" className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {errors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}
          {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}

          {slides.length > 0 && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Your slide playlist</h3>
                    <p className="text-xs text-slate-500">{slideCount} of {slides.length} slides included · use the arrows to change order</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={controlClass} onClick={() => setSlides((items) => items.map((slide) => ({ ...slide, included: true })))}><Check className="h-4 w-4" />Include all</button>
                    <button type="button" className={controlClass} onClick={() => setSlides((items) => items.map((slide) => ({ ...slide, included: false })))}>Exclude all</button>
                    <button type="button" className={`${controlClass} text-rose-600 hover:border-rose-200 hover:bg-rose-50`} onClick={clearSlides}><Trash2 className="h-4 w-4" />Clear playlist</button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {slides.map((slide, index) => (
                    <article key={slide.id} className={`overflow-hidden rounded-xl border transition ${slide.included ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                      <div className="relative flex aspect-video items-center justify-center bg-slate-100">
                        <img src={slide.imageDataUrl} alt={`Preview: ${slide.title}`} className="h-full w-full object-contain" />
                        <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">Slide {index + 1}</span>
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="flex flex-wrap items-start gap-2">
                          <label className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={slide.included} onChange={(event) => updateSlide(slide.id, { included: event.target.checked })} className="h-4 w-4 accent-indigo-600" />
                            Include
                          </label>
                          <div className="min-w-0 flex-[1_1_8rem]">
                            <p className="truncate text-xs font-bold text-slate-800" title={slide.sourceName}>{slide.sourceName}</p>
                            <p className="break-words text-[10px] text-slate-500">{slide.sourceKind === 'pdf' || slide.sourceKind === 'docx' ? `Page ${slide.pageNumber}` : 'Image'} · {slide.title}</p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <button type="button" aria-label={`Move slide ${index + 1} up`} className="rounded p-1 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-30" disabled={index === 0} onClick={() => moveSlide(index, -1)}><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" aria-label={`Move slide ${index + 1} down`} className="rounded p-1 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-30" disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)}><ArrowDown className="h-4 w-4" /></button>
                            <button type="button" aria-label={`Remove slide ${index + 1}`} className="rounded p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeSlide(slide.id)}><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Caption (optional)
                          <input value={slide.caption} onChange={(event) => updateSlide(slide.id, { caption: event.target.value })} maxLength={160} placeholder="Shown over this slide" className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-normal text-slate-800 focus:border-indigo-400 focus:outline-none" />
                        </label>
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Slide duration in seconds
                          <input type="number" min={0} max={86400} step={1} value={slide.durationSeconds ?? ''} onChange={(event) => updateSlide(slide.id, { durationSeconds: event.target.value === '' ? null : Math.max(0, Math.min(86400, Number(event.target.value))) })} placeholder={`Use default: ${defaultDuration}s`} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-normal text-slate-800 focus:border-indigo-400 focus:outline-none" />
                          <span className="mt-1 block font-normal text-slate-400">Blank uses the default. Set to 0 for manual advance.</span>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Show and screen options</h3>
                  <p className="text-xs text-slate-500">Set a default for the playlist; a slide-specific duration overrides it.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Default time per slide (seconds)
                    <input type="number" min={1} max={86400} value={defaultDuration} onChange={(event) => setDefaultDuration(Math.max(1, Math.min(86400, Number(event.target.value) || 1)))} className={selectClass} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    How slides fit the screen
                    <select value={fitMode} onChange={(event) => setFitMode(event.target.value as FitMode)} className={selectClass}>
                      <option value="contain">Contain · show the whole page</option>
                      <option value="cover">Cover · fill screen, may crop edges</option>
                      <option value="fill">Stretch · fill screen, may distort</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Slide transition
                    <select value={transition} onChange={(event) => setTransition(event.target.value as TransitionMode)} className={selectClass}>
                      <option value="none">Cut · instant</option>
                      <option value="fade">Fade</option>
                      <option value="zoom">Slow zoom</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Screen background
                    <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
                      <input type="color" aria-label="Screen background color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0" />
                      <span className="font-normal text-slate-500">{background}</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Loop continuously</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="h-4 w-4 accent-indigo-600" /><Shuffle className="h-4 w-4 text-slate-500" />Shuffle slide order</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={showSlideCounter} onChange={(event) => setShowSlideCounter(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Show slide number</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={showClock} onChange={(event) => setShowClock(event.target.checked)} className="h-4 w-4 accent-indigo-600" /><Clock3 className="h-4 w-4 text-slate-500" />Show local time</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={showDate} onChange={(event) => setShowDate(event.target.checked)} className="h-4 w-4 accent-indigo-600" /><CalendarDays className="h-4 w-4 text-slate-500" />Show local date</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={requestWakeLock} onChange={(event) => setRequestWakeLock(event.target.checked)} className="h-4 w-4 accent-indigo-600" /><Sun className="h-4 w-4 text-slate-500" />Ask browser to keep screen awake</label>
                  <label className="text-xs font-semibold text-slate-700">
                    Clock position
                    <select value={clockPosition} onChange={(event) => setClockPosition(event.target.value as ClockPosition)} className={selectClass}>
                      <option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={use24Hour} onChange={(event) => setUse24Hour(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Use 24-hour clock</label>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-slate-500">In the player: Space/P pauses, ←/→ changes slides, F toggles fullscreen, and Esc exits browser fullscreen. Controls fade while playing and return when you move the pointer.</p>
                  <button type="button" onClick={startShow} disabled={slideCount === 0 || processing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45">
                    <Play className="h-5 w-5" />Start show · {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
                  </button>
                </div>
                {wakeLockMessage && <p role="status" className="mt-3 text-xs text-amber-700">{wakeLockMessage}</p>}
              </section>
            </>
          )}

          {slides.length === 0 && !processing && (
            <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
              <div className="mb-2 flex justify-center gap-2 text-slate-400"><FileText className="h-5 w-5" /><FileImage className="h-5 w-5" /></div>
              <span lang={i18n.language}>{t('displayPage.empty')}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default DisplayStudio;
