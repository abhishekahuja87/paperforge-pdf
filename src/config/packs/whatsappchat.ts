import whatsappchat from '../../locales/packs/whatsappchat.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** WhatsApp Chat to PDF (components/tools/whatsapp, logic in src/lib/whatsapp). Runs in the browser. */
export const WHATSAPPCHAT_TOOLS: PackTool[] = [
  definePackTool({
    id: 'whatsapp-chat-to-pdf', kind: 'whatsappChat', guideKey: 'whatsappChatGuide', category: 'pdf', icon: 'file-text', tier: 'popular',
    keywords: ['whatsapp chat to pdf', 'export whatsapp chat as pdf', 'convert whatsapp chat to pdf', 'whatsapp chat pdf with photos', 'save whatsapp conversation as pdf', 'print whatsapp chat', 'whatsapp txt to pdf', 'whatsapp chat backup pdf', 'whatsapp chat to pdf free online', 'whatsapp chat to pdf hindi emoji', 'whatsapp group chat to pdf', 'whatsapp chat date range pdf'],
  }, whatsappchat.toolCatalog),
];
