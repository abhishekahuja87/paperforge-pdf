import ppt from '../../locales/packs/ppt.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** PowerPoint makers (components/tools/decks, outline builder in src/lib/decks, file writer in src/lib/pptx). Each builds a .pptx in the browser from a text outline. */
export const PPT_TOOLS: PackTool[] = [
  definePackTool({
    id: 'text-to-powerpoint-maker', kind: 'pptTextToPpt', guideKey: 'textToPptPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['text to powerpoint maker', 'convert text to ppt', 'outline to powerpoint slides', 'free ppt maker no sign up', 'make powerpoint from notes', 'simple ppt maker', 'presentation maker free download', 'pptx maker online', 'bullet points to slides', 'create ppt from text', 'powerpoint maker for students', 'quick presentation maker'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'pitch-deck-powerpoint-maker', kind: 'pptPitchDeck', guideKey: 'pitchDeckPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['pitch deck template ppt', 'startup pitch deck format', 'pitch deck powerpoint free', 'investor pitch deck slides', 'product launch presentation template', 'business pitch ppt', 'pitch deck outline', 'pitch deck slides', 'pitch presentation maker', 'startup presentation template', 'pitch deck pptx download', 'how to make a pitch deck'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'business-proposal-powerpoint-maker', kind: 'pptProposal', guideKey: 'proposalPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['business proposal powerpoint template', 'company profile ppt format', 'client proposal presentation', 'company profile powerpoint free', 'proposal deck template', 'business presentation template', 'company introduction ppt', 'service proposal ppt', 'project proposal presentation', 'company profile pptx', 'proposal slides for client', 'agency proposal ppt'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'lesson-powerpoint-maker', kind: 'pptLesson', guideKey: 'lessonPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['lesson plan powerpoint template', 'teacher ppt template', 'classroom presentation maker', 'revision slides template', 'ppt for teaching', 'lesson slides for class', 'school lesson ppt', 'tuition class ppt', 'teaching presentation free', 'lesson powerpoint free download', 'chapter revision ppt', 'training session ppt'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'project-status-powerpoint-maker', kind: 'pptStatus', guideKey: 'statusPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['project status report ppt', 'weekly status update template', 'team update presentation', 'monthly review powerpoint', 'status report slides', 'project update ppt free', 'progress report presentation', 'milestone status ppt', 'weekly team meeting slides', 'management review ppt', 'project progress ppt template', 'status update powerpoint download'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'school-project-powerpoint-maker', kind: 'pptSchoolProject', guideKey: 'schoolProjectPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['school project presentation template', 'seminar presentation format', 'ppt for school project', 'college seminar ppt template', 'student project slides', 'science project ppt', 'project presentation ppt free', 'seminar ppt download', 'presentation for class project', 'simple school ppt', 'project work presentation', 'how to make a project ppt'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'quiz-powerpoint-maker', kind: 'pptQuiz', guideKey: 'quizPptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['quiz powerpoint template free', 'make quiz in powerpoint', 'quiz slides with answers', 'general knowledge quiz ppt', 'multiple choice quiz ppt', 'school quiz presentation', 'quiz game ppt', 'quiz show template', 'quiz questions ppt format', 'quiz night slides', 'classroom quiz powerpoint', 'quiz maker ppt download'],
  }, ppt.toolCatalog),
  definePackTool({
    id: 'event-programme-powerpoint-maker', kind: 'pptEventProgramme', guideKey: 'eventProgrammePptGuide', category: 'business', icon: 'presentation', tier: 'popular',
    keywords: ['annual day presentation ppt', 'event programme ppt template', 'workshop agenda slides', 'function schedule presentation', 'welcome slides for event', 'school function ppt', 'event slides for stage', 'programme schedule ppt', 'society event presentation', 'meeting agenda powerpoint', 'event welcome ppt', 'farewell programme ppt'],
  }, ppt.toolCatalog),
];
