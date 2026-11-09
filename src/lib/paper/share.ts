import { coerceSettings } from './settings';
import type { PaperSettings } from './types';

/** Settings packed into a URL fragment so a link reopens the same sheet. Nothing is sent to a server. */
export const SHARE_KEY = 'paper';

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
};

export const encodeShare = (settings: PaperSettings): string => `${SHARE_KEY}=${toBase64Url(JSON.stringify(settings))}`;

/** Reads settings back from a hash such as "#paper=...". Returns null when there is none or it is damaged. */
export function decodeShare(hash: string): PaperSettings | null {
  const match = new RegExp(`[#&]${SHARE_KEY}=([A-Za-z0-9_-]+)`).exec(hash);
  if (!match) return null;
  try {
    return coerceSettings(JSON.parse(fromBase64Url(match[1])));
  } catch {
    return null;
  }
}
