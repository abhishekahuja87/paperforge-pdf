/** Resume (CV) in Word: name and contact line, summary, experience, education, skills and extra points. */
import type { Block, DocModel } from '../docx/model';
import { P, clean, lines, type DocInput } from './kit';
import T from '../../locales/packs/worddocs.text.en.json';

const t = T.resume.doc;
const ACCENT = '1F4E79';

export function buildResume(i: DocInput): DocModel {
  const v = i.values, clean_ = i.look === 'clean', accent = clean_ ? ACCENT : '000000';
  const blocks: Block[] = [];
  blocks.push(P(clean(v.name) || ' ', { size: 22, bold: true, align: clean_ ? 'left' : 'center', color: clean_ ? ACCENT : undefined, after: 2 }));
  if (clean(v.headline)) blocks.push(P(clean(v.headline), { size: 12, align: clean_ ? 'left' : 'center', color: '444444', after: 2 }));
  const contact = [v.email, v.phone, v.city, v.link].map(clean).filter(Boolean).join('   |   ');
  if (contact) blocks.push(P(contact, { size: 10, align: clean_ ? 'left' : 'center', color: '444444', after: 8 }));
  const heading = (text: string) => { first = true; blocks.push(P(text.toUpperCase(), { bold: true, size: 11, color: accent, rule: clean_ ? ACCENT : '000000', before: 8, after: 4, keepNext: true })); };
  let first = true;
  const entry = (title: string, where: string, when: string, extra: string[], bullets: string[]) => {
    if (!first) blocks.push(P('', { size: 3, after: 5 }));
    first = false;
    blocks.push({ type: 'table', widths: [72, 28], rows: [[{ runs: [{ text: title, bold: true }, ...(where ? [{ text: where ? `, ${where}` : '' }] : [])] }, { runs: when, align: 'right', color: '444444' }]] });
    extra.forEach((e) => blocks.push(P(e, { italic: true, color: '444444', after: 2 })));
    bullets.forEach((b) => blocks.push(P(b, { bullet: true, after: 1 })));
  };
  if (clean(v.summary)) { heading(t.summary); blocks.push(P(clean(v.summary), { align: 'both' })); }
  const jobs = (i.lists.jobs ?? []).filter((j) => clean(j.role) || clean(j.company));
  if (jobs.length) { heading(t.experience); jobs.forEach((j) => entry(clean(j.role), clean(j.company), clean(j.dates), [], lines(j.points))); }
  const schools = (i.lists.schools ?? []).filter((s) => clean(s.degree) || clean(s.school));
  if (schools.length) { heading(t.education); schools.forEach((s) => entry(clean(s.degree), clean(s.school), clean(s.years), clean(s.note) ? [clean(s.note)] : [], [])); }
  if (clean(v.skills)) { heading(t.skills); blocks.push(P(clean(v.skills).split(',').map((s) => s.trim()).filter(Boolean).join('  •  '))); }
  if (lines(v.extra).length) { heading(t.extra); lines(v.extra).forEach((l) => blocks.push(P(l, { bullet: true, after: 1 }))); }
  return { title: clean(v.name) || 'Resume', blocks, paper: i.region.paper, font: clean_ ? 'Calibri' : 'Times New Roman', size: 10.5, margin: 18 };
}
