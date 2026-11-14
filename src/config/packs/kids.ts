import kids from '../../locales/packs/kids.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Games and practice for children, and family party games. Each tool runs in the browser and nothing is uploaded. */
export const KIDS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'kids-money-shop', kind: 'moneyShop', guideKey: 'kidsMoneyShop', category: 'everyday', icon: 'calculator', tier: 'popular',
    keywords: ['money shop for kids', 'learn indian rupees', 'rupee notes and coins game', 'counting money for kids', 'giving change game', 'pretend shop game', 'money game class 1 2 3', 'play money rupees', 'shopkeeper game for kids', 'learn to count money online'],
  }, kids.toolCatalog),
  definePackTool({
    id: 'tambola-ticket-generator', kind: 'tambola', guideKey: 'kidsTambola', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['tambola ticket generator', 'housie tickets printable', 'tambola number caller', 'housie number generator', 'tambola tickets pdf', 'print tambola tickets', 'tambola game online', 'housie game for kitty party', 'tambola for family party', 'random number caller 1 to 90'],
  }, kids.toolCatalog),
];
