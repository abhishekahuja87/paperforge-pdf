import React from 'react';
import { buildGradebook } from '../../../lib/workbooks/gradebook';
import { splitList } from '../../../lib/workbooks/kit';
import T from '../../../locales/packs/workbooks.more2.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.gradebook.ui;
const SPEC: ListSpec = {
  id: 'gradebook', fileBase: 'marks-and-rank-sheet', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'title', label: t.title, placeholder: t.titlePlaceholder, max: 60 }, { key: 'subjects', label: t.subjects, hint: t.subjectsHint, max: 120 }],
  numbers: [{ key: 'max', label: t.max, hint: t.maxHint, min: 1, max: 1000 }, { key: 'pass', label: t.pass, hint: t.passHint, min: 0, max: 100 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 100 }],
  more: ['spare'], region: {},
  defaults: { title: '', subjects: 'English, Hindi, Maths, EVS, Art', max: 100, pass: 35, spare: 10 },
  starters: T.gradebook.starters, sampleHeaders: [t.fieldName, t.fieldRoll],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['student', 'student name', 'pupil', 'name'], required: true }, { key: 'roll', label: t.fieldRoll, aliases: ['roll', 'roll no', 'roll number', 'admission no', 'id'] }],
  maxRows: 200, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildGradebook({ title: String(settings.title), rows, subjects: splitList(String(settings.subjects), 6), maxMarks: Number(settings.max), passPercent: Number(settings.pass), spare: Number(settings.spare), sample, region, hinglish }),
};

/** Gradebook Excel maker. */
export const GradebookWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default GradebookWorkbook;
