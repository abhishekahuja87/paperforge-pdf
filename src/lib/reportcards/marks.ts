/**
 * Reading a class mark list pasted from a spreadsheet and working out totals, percentages, grades and ranks.
 * The grade bands and the pass mark are the person's own; nothing here knows any school or board rules.
 */
export interface Parsed { subjects: string[]; max: number[]; rows: { name: string; roll: string; marks: (number | null)[] }[] }
export interface Band { min: number; grade: string; remark: string }
export interface Student { name: string; roll: string; marks: (number | null)[]; total: number; percent: number; grade: string; remark: string; rank: number; failed: string[] }

const split = (line: string, delimiter: string) => (delimiter === ',' ? line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/) : line.split(delimiter)).map((cell) => cell.trim().replace(/^"|"$/g, '').trim());

/** Reads pasted text: a header row (Name, optional Roll, then one column for each subject) and one row for each student. A subject written as "Maths (50)" sets its maximum. */
export function parseMarks(text: string): Parsed | null {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return null;
  const delimiter = lines[0]!.includes('\t') ? '\t' : lines[0]!.includes(';') && !lines[0]!.includes(',') ? ';' : ',';
  const header = split(lines[0]!, delimiter);
  const rollAt = header.findIndex((cell, n) => n > 0 && /^(roll|admission|adm|id|reg)/i.test(cell));
  const subjectAt = header.map((_, n) => n).filter((n) => n > 0 && n !== rollAt);
  if (subjectAt.length === 0) return null;
  const subjects: string[] = [], max: number[] = [];
  for (const n of subjectAt) {
    const match = /^(.*?)\s*[([]\s*(\d+(?:\.\d+)?)\s*[)\]]\s*$/.exec(header[n]!);
    subjects.push((match ? match[1]! : header[n]!).trim() || `Subject ${subjects.length + 1}`); max.push(match ? Number(match[2]) : 100);
  }
  const rows = lines.slice(1).map((line) => {
    const cells = split(line, delimiter);
    return { name: cells[0] ?? '', roll: rollAt >= 0 ? cells[rollAt] ?? '' : '', marks: subjectAt.map((n) => { const raw = (cells[n] ?? '').replace(/,/g, '.'); const value = Number(raw); return raw !== '' && Number.isFinite(value) ? value : null; }) };
  }).filter((row) => row.name !== '');
  return rows.length === 0 ? null : { subjects, max, rows };
}

/** Reads grade bands written one per line, such as "90 A+ Excellent". */
export function parseBands(text: string): Band[] {
  const bands: Band[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(\d+(?:\.\d+)?)\s*%?\s+(\S+)\s*(.*)$/.exec(line);
    if (match) bands.push({ min: Number(match[1]), grade: match[2]!, remark: match[3]!.trim() });
  }
  return bands.sort((a, b) => b.min - a.min);
}

/** Totals, percentages, grades and ranks. `passPercent` of 0 leaves out pass and fail. Rank 1 is the highest total; equal totals share a rank. */
export function compute(parsed: Parsed, max: number[], bands: Band[], passPercent: number): Student[] {
  const maxTotal = max.reduce((sum, value) => sum + value, 0) || 1;
  const students: Student[] = parsed.rows.map((row) => {
    const total = row.marks.reduce<number>((sum, value) => sum + (value ?? 0), 0), percent = (total / maxTotal) * 100;
    const band = bands.find((item) => percent >= item.min);
    const failed = passPercent > 0 ? parsed.subjects.filter((_, n) => row.marks[n] === null || (row.marks[n]! / (max[n] || 1)) * 100 < passPercent) : [];
    return { name: row.name, roll: row.roll, marks: row.marks, total, percent, grade: band?.grade ?? '', remark: band?.remark ?? '', rank: 0, failed };
  });
  const order = [...students].sort((a, b) => b.total - a.total);
  order.forEach((student, n) => { student.rank = n > 0 && student.total === order[n - 1]!.total ? order[n - 1]!.rank : n + 1; });
  return students;
}

export const gradeFor = (percent: number, bands: Band[]) => bands.find((item) => percent >= item.min)?.grade ?? '';
export const round1 = (value: number) => (Math.round(value * 10) / 10).toString();
