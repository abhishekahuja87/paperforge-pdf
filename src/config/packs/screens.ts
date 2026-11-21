import screens from '../../locales/packs/screens.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Big-screen tools for classrooms, gyms, shops and offices: timers, boards and displays. Each runs in the browser and nothing is uploaded. Screens live in components/tools/screens. */
export const SCREENS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'interval-circuit-timer', kind: 'screenInterval', guideKey: 'screensIntervalTimer', category: 'display', icon: 'clock', tier: 'popular',
    keywords: ['interval timer', 'tabata timer', 'hiit timer', 'circuit training timer', 'emom timer', 'boxing round timer', 'work and rest timer', 'workout timer full screen', 'gym interval timer for tv', 'study sprint timer', 'round timer with beep', 'exercise interval timer online'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'yoga-class-display', kind: 'screenYoga', guideKey: 'screensYogaDisplay', category: 'display', icon: 'dumbbell', tier: 'more',
    keywords: ['yoga class display', 'yoga sequence timer', 'stretching timer', 'yoga flow on tv', 'stretch break timer', 'pose timer for yoga', 'yoga class screen', 'morning stretch routine timer', 'desk stretch timer', 'yoga timer with poses', 'mobility routine timer', 'warm up and cool down display'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'exam-hall-display', kind: 'screenExamHall', guideKey: 'screensExamHall', category: 'display', icon: 'clock', tier: 'popular',
    keywords: ['exam hall clock', 'exam timer for classroom', 'exam countdown display', 'exam time left on projector', 'test timer full screen', 'exam hall display screen', 'online exam clock', 'mock test timer', 'class test timer', 'exam timer with rules', 'pens down timer', 'invigilator clock'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'menu-board-display', kind: 'screenMenu', guideKey: 'screensMenuBoard', category: 'display', icon: 'receipt', tier: 'more',
    keywords: ['digital menu board', 'menu display for tv', 'cafe menu board', 'price list display', 'restaurant menu screen', 'shop price board', 'daily specials board', 'salon price list screen', 'tea stall menu display', 'menu slideshow for tv', 'free digital signage menu', 'price board for shop'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'queue-token-display', kind: 'screenToken', guideKey: 'screensQueueToken', category: 'display', icon: 'hash', tier: 'more',
    keywords: ['token display', 'now serving display', 'queue number display', 'token number screen', 'waiting room number display', 'queue management free', 'clinic token system', 'counter number display', 'token calling screen', 'next number display', 'queue token display for shop', 'ticket number display'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'daily-timings-board', kind: 'screenTimings', guideKey: 'screensTimingsBoard', category: 'display', icon: 'clock', tier: 'more',
    keywords: ['timings board', 'daily schedule display', 'temple timings board', 'prayer timings display', 'opening hours display', 'clinic timings board', 'event programme display', 'schedule screen for tv', 'community hall timings', 'society notice timings', 'what is on now display', 'digital timetable board'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'spelling-bee-display', kind: 'screenBee', guideKey: 'screensSpellingBee', category: 'display', icon: 'type', tier: 'more',
    keywords: ['spelling bee display', 'spelling bee for classroom', 'vocabulary game for class', 'word reveal game', 'spelling practice on screen', 'spelling bee words generator', 'classroom spelling game', 'vocabulary quiz display', 'spell the word game', 'word of the day display', 'spelling test display', 'vocabulary revision screen'],
  }, screens.toolCatalog),
  definePackTool({
    id: 'notice-board-display', kind: 'screenNotices', guideKey: 'screensNoticeBoard', category: 'display', icon: 'presentation', tier: 'more',
    keywords: ['digital notice board', 'notice board for tv', 'birthday wish display', 'welcome screen for office', 'announcement board', 'reception display screen', 'school notice board display', 'greeting board for tv', 'digital signage free', 'rotating messages display', 'office notice screen', 'holiday notice display'],
  }, screens.toolCatalog),
];
