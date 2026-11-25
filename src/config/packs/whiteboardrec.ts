import whiteboardrec from '../../locales/packs/whiteboardrec.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Whiteboard Lesson Recorder (components/tools/whiteboard, logic in src/lib/whiteboard). Runs in the browser. */
export const WHITEBOARDREC_TOOLS: PackTool[] = [
  definePackTool({
    id: 'whiteboard-lesson-recorder', kind: 'whiteboardRec', guideKey: 'whiteboardRecGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['whiteboard recorder online', 'record whiteboard video with voice', 'online whiteboard video maker', 'draw and record video', 'teaching whiteboard recorder free', 'blackboard video recorder', 'write and record lesson video', 'whiteboard animation recorder phone', 'explain by drawing video', 'free whiteboard screen recorder alternative', 'tutor video whiteboard', 'digital whiteboard recorder'],
  }, whiteboardrec.toolCatalog),
];
