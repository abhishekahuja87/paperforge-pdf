import qr from '../../locales/packs/qr.en.json';
import { definePackTool, type PackTool } from './types';

/** QR codes: one generator plus pages that open it on Wi-Fi and contact cards. */
export const QR_TOOLS: PackTool[] = [
  definePackTool({
    id: 'qr-code-generator', kind: 'qrGenerator', guideKey: 'qrGeneratorGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['qr code generator', 'qr code maker', 'free qr code', 'qr code no expiry', 'qr code for link', 'qr code png svg', 'qr code with logo', 'create qr code'],
  }, qr.toolCatalog),
  definePackTool({
    id: 'wifi-qr-code-generator', kind: 'qrWifi', guideKey: 'wifiQrGuide', category: 'everyday', icon: 'lock', tier: 'popular',
    keywords: ['wifi qr code', 'wifi qr code generator', 'share wifi password qr', 'guest wifi qr', 'qr code for wifi', 'wifi table card'],
  }, qr.toolCatalog),
  definePackTool({
    id: 'vcard-qr-code-generator', kind: 'qrContact', guideKey: 'vcardQrGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['vcard qr code', 'business card qr code', 'contact qr code', 'qr code save contact', 'digital business card qr'],
  }, qr.toolCatalog),
];
