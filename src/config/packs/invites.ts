import invites from '../../locales/packs/invites.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The invitation card maker. The picture is drawn in the browser with fonts bundled with the site. */
export const INVITES_TOOLS: PackTool[] = [
  definePackTool({
    id: 'invitation-card-maker', kind: 'invitationCardMaker', guideKey: 'invitationCardMakerGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['invitation card maker', 'wedding invitation card maker', 'birthday invitation card maker', 'free invitation card maker', 'invitation card for whatsapp', 'housewarming invitation card', 'baby shower invitation maker', 'engagement invitation card', 'invitation card maker online free', 'digital invitation card', 'e invitation maker', 'party invitation maker'],
  }, invites.toolCatalog),
];
