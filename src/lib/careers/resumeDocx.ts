/** Saves the Resume Builder's resume as a Word document. Same words as the PDF, laid out as plain, editable single-column text that online application systems read in the right order. */
import type { Block, DocModel } from '../docx/model';
import { formatMonth, formatRange, splitLines, splitSkills, type ResumeData } from './resume';
import { getTemplate } from './resumeTemplates';

export interface ResumeWordStyle { template: string; accent: string; size: 'compact' | 'normal' | 'large'; paper: 'a4' | 'letter' }

const SIZE = { compact: 10, normal: 10.5, large: 11.5 } as const;
const hex = (c: string) => c.replace('#', '').toUpperCase();
const P = (runs: string, o: Partial<Extract<Block, { type: 'p' }>> = {}): Block => ({ type: 'p', runs, ...o });

export function buildResumeWord(resume: ResumeData, style: ResumeWordStyle): DocModel {
  const spec = getTemplate(style.template);
  const accent = spec.colour ? hex(style.accent) : '000000';
  const align = spec.header === 'center' ? 'center' : 'left';
  const blocks: Block[] = [];
  const name = resume.name.trim() || ' ';
  blocks.push(P(name, { size: 22, bold: true, color: accent, align, after: 2 }));
  if (resume.headline.trim()) blocks.push(P(resume.headline.trim(), { size: 12, color: '444444', align, after: 2 }));
  const contact = [resume.email, resume.phone, resume.location, ...splitLines(resume.links)].map((x) => x.trim()).filter(Boolean).join('   |   ');
  if (contact) blocks.push(P(contact, { size: 10, color: '444444', align, after: 6 }));
  let first = true;
  const section = (title: string) => { first = true; blocks.push(P(title.toUpperCase(), { bold: true, size: 11, color: accent, rule: accent, before: 8, after: 4, keepNext: true })); };
  const entry = (title: string, where: string, when: string, sub: string, bullets: string[]) => {
    if (!first) blocks.push(P('', { size: 3, after: 5 }));
    first = false;
    blocks.push({ type: 'table', widths: [70, 30], rows: [[{ runs: [{ text: title, bold: true }, ...(where ? [{ text: `, ${where}` }] : [])] }, { runs: when, align: 'right', color: '444444' }]] });
    if (sub) blocks.push(P(sub, { italic: true, color: '444444', after: 2 }));
    bullets.forEach((b) => blocks.push(P(b, { bullet: true, after: 1 })));
  };
  if (resume.summary.trim()) { section('Summary'); blocks.push(P(resume.summary.trim(), { align: 'both' })); }
  const jobs = resume.experience.filter((j) => j.role.trim() || j.company.trim());
  if (jobs.length) { section('Experience'); jobs.forEach((j) => entry(j.role.trim() || j.company.trim(), j.role.trim() ? [j.company.trim(), j.location.trim()].filter(Boolean).join(', ') : j.location.trim(), formatRange(j.start, j.end, j.current), '', splitLines(j.bullets))); }
  const projects = resume.projects.filter((p) => p.name.trim() || p.details.trim());
  if (projects.length) { section('Projects'); projects.forEach((p) => entry(p.name.trim() || 'Project', '', p.link.trim(), '', splitLines(p.details))); }
  const schools = resume.education.filter((e) => e.degree.trim() || e.school.trim());
  if (schools.length) { section('Education'); schools.forEach((e) => entry(e.degree.trim() || e.school.trim(), e.degree.trim() ? [e.school.trim(), e.location.trim()].filter(Boolean).join(', ') : e.location.trim(), [formatMonth(e.start), formatMonth(e.end)].filter(Boolean).join(' – '), '', splitLines(e.details))); }
  const skills = splitSkills(resume.skills);
  if (skills.length) { section('Skills'); blocks.push(P(skills.join('  •  '))); }
  const certs = splitLines(resume.certifications);
  if (certs.length) { section('Certifications'); certs.forEach((c) => blocks.push(P(c, { bullet: true, after: 1 }))); }
  return { title: resume.name.trim() || 'Resume', blocks, paper: style.paper, font: spec.font === 'serif' ? 'Times New Roman' : 'Calibri', size: SIZE[style.size], margin: 18 };
}
