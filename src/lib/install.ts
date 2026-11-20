import { useSyncExternalStore } from 'react';

/** Support for "Install app": the browser's install prompt on Android and computers, and a hint for Safari on iPhone and iPad. */
interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPrompt | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Call once at start-up so the prompt is not missed. */
export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferred = event as InstallPrompt; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; notify(); });
}

export const isStandalone = (): boolean => {
  try { return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true; } catch { return false; }
};

export const isIosSafari = (): boolean => {
  const agent = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS/.test(agent);
};

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const prompt = deferred;
  deferred = null;
  notify();
  await prompt.prompt();
  return (await prompt.userChoice).outcome === 'accepted';
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
/** True when the browser has offered to install the app and it has not been installed or used. */
export const useCanInstall = (): boolean => useSyncExternalStore(subscribe, () => deferred !== null && !installed, () => false);
