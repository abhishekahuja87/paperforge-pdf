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
  definePackTool({
    id: 'shadow-explorer-for-kids', kind: 'shadow', guideKey: 'kidsShadow', category: 'everyday', icon: 'sun', tier: 'popular',
    keywords: ['shadow game for kids', 'how shadows are made', 'sun and shadow for kids', 'why shadow changes during the day', 'shadow length and sun position', 'move the sun shadow activity', 'science for kids shadows', 'shadow quiz for kids', 'sun position shadow simulator', 'class 3 shadows'],
  }, kids.toolCatalog),
  definePackTool({
    id: 'addition-with-carrying-for-kids', kind: 'addition', guideKey: 'kidsAddition', category: 'everyday', icon: 'plus', tier: 'popular',
    keywords: ['addition with carrying', 'column addition for kids', 'carry over addition', 'how to carry in addition', 'addition with regrouping', 'two digit addition with carry', 'three digit addition with carry', 'addition practice for kids', 'class 2 addition carry', 'learn addition step by step'],
  }, kids.toolCatalog),
  definePackTool({
    id: 'subtraction-with-borrowing-for-kids', kind: 'subtraction', guideKey: 'kidsSubtraction', category: 'everyday', icon: 'minus', tier: 'popular',
    keywords: ['subtraction with borrowing', 'column subtraction for kids', 'how to borrow in subtraction', 'subtraction with regrouping', 'borrowing across zero', 'two digit subtraction with borrowing', 'three digit subtraction with borrowing', 'subtraction practice for kids', 'class 2 subtraction borrow', 'learn subtraction step by step'],
  }, kids.toolCatalog),
  definePackTool({
    id: 'long-multiplication-for-kids', kind: 'multiplication', guideKey: 'kidsMultiplication', category: 'everyday', icon: 'times', tier: 'popular',
    keywords: ['long multiplication', 'column multiplication for kids', 'how to multiply two digit numbers', 'multiplication with carrying', 'multiply by 2 digit number', 'multiplication step by step', 'multiplication practice for kids', 'class 3 multiplication', 'class 4 multiplication', 'learn multiplication online'],
  }, kids.toolCatalog),
];
