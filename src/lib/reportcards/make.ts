/** Saving the report cards: one PDF with the rank list and every card, or a zip with one PDF for each student. */
import { canvasesToPdf } from '../pdf/pagesPdf';
import { drawCard, drawRankPage, PAGE, rankPageCount, type RankPageOptions } from './draw';
import type { Student } from './marks';

export interface MakeOptions extends RankPageOptions { rankList: boolean; cards: boolean; title: string }

/** One PDF: the rank list first (when chosen), then a card for each student in the list order. */
export function makeReportPdf(o: MakeOptions, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const rankPages = o.rankList ? rankPageCount(o.students.length) : 0, cardPages = o.cards ? o.students.length : 0;
  return canvasesToPdf(rankPages + cardPages, (n) => (n < rankPages ? drawRankPage(n, o) : drawCard(o.students[n - rankPages]!, o)), PAGE.points, o.title, onProgress, cancelled);
}

const safe = (text: string) => text.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50) || 'student';

/** A zip with one PDF for each student, named by roll number and name. */
export async function makeReportZip(o: MakeOptions, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const { default: JSZip } = await import('jszip'), zip = new JSZip(), used = new Set<string>();
  for (let n = 0; n < o.students.length; n += 1) {
    if (cancelled()) return null;
    const student: Student = o.students[n]!;
    const blob = await canvasesToPdf(1, () => drawCard(student, o), PAGE.points, `${o.title} - ${student.name}`, () => undefined, cancelled);
    if (!blob) return null;
    let name = safe(`${student.roll ? `${student.roll} ` : ''}${student.name}`), tries = 2; while (used.has(name.toLowerCase())) { name = `${safe(student.name)} ${tries}`; tries += 1; }
    used.add(name.toLowerCase()); zip.file(`${name}.pdf`, await blob.arrayBuffer()); onProgress(n + 1);
  }
  if (o.rankList) {
    const blob = await canvasesToPdf(rankPageCount(o.students.length), (n) => drawRankPage(n, o), PAGE.points, o.title, () => undefined, cancelled);
    if (blob) zip.file('Rank list.pdf', await blob.arrayBuffer());
  }
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

/** The results as a CSV file that opens in Excel. */
export function resultsCsv(students: Student[], subjects: string[], max: number[]): Blob {
  const q = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value.replace(/^([=+\-@])/, "'$1"));
  const head = ['Rank', 'Name', 'Roll', ...subjects.map((name, n) => `${name} (${max[n]})`), 'Total', 'Percentage', 'Grade', 'Result'];
  const rows = [...students].sort((a, b) => a.rank - b.rank).map((s) => [String(s.rank), s.name, s.roll, ...s.marks.map((m) => (m === null ? 'AB' : String(m))), String(s.total), (Math.round(s.percent * 10) / 10).toString(), s.grade, s.failed.length === 0 ? 'Pass' : 'Fail']);
  return new Blob(['﻿', [head, ...rows].map((row) => row.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
}
