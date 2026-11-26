/** The places a sign can send people to, and turning what the owner typed into a link a phone can open. */
import { normaliseLink } from './draw';

export type PlatformId = 'google' | 'instagram' | 'facebook' | 'youtube' | 'whatsapp' | 'zomato' | 'swiggy' | 'tripadvisor' | 'justdial' | 'maps' | 'marketplace' | 'apps' | 'website' | 'menu' | 'telegram' | 'linkedin' | 'other';
export const PLATFORM_IDS: PlatformId[] = ['google', 'instagram', 'facebook', 'youtube', 'whatsapp', 'zomato', 'swiggy', 'tripadvisor', 'justdial', 'maps', 'marketplace', 'apps', 'website', 'menu', 'telegram', 'linkedin', 'other'];

/** Where a typed handle such as @mycafe goes. Only for sites where that is how people find you. */
const HANDLE_BASE: Partial<Record<PlatformId, string>> = {
  instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/', youtube: 'https://www.youtube.com/@', telegram: 'https://t.me/',
};

/** The link for the QR code, or '' when what was typed cannot be turned into one. */
export function linkFor(platform: PlatformId, raw: string): string {
  const text = raw.trim(); if (!text) return '';
  if (platform === 'whatsapp') {
    const digits = text.replace(/[\s+\-()]/g, '');
    if (/^\d{10}$/.test(digits)) return `https://wa.me/91${digits}`;
    if (/^\d{11,15}$/.test(digits)) return `https://wa.me/${digits}`;
  }
  const base = HANDLE_BASE[platform];
  if (base) {
    const handle = text.replace(/^@/, '');
    if (/^[A-Za-z0-9_.-]{2,60}$/.test(handle) && (text.startsWith('@') || !handle.includes('.'))) return `${base}${handle}`;
  }
  return normaliseLink(text);
}
