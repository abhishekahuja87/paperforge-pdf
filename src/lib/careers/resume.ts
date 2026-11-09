export interface ResumeExperience { id: string; role: string; company: string; location: string; start: string; end: string; current: boolean; bullets: string }
export interface ResumeEducation { id: string; degree: string; school: string; location: string; start: string; end: string; details: string }
export interface ResumeProject { id: string; name: string; link: string; details: string }

export interface ResumeData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  skills: string;
  certifications: string;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export const newExperience = (): ResumeExperience => ({ id: uid(), role: '', company: '', location: '', start: '', end: '', current: false, bullets: '' });
export const newEducation = (): ResumeEducation => ({ id: uid(), degree: '', school: '', location: '', start: '', end: '', details: '' });
export const newProject = (): ResumeProject => ({ id: uid(), name: '', link: '', details: '' });

export const emptyResume = (): ResumeData => ({
  name: '', headline: '', email: '', phone: '', location: '', links: '', summary: '',
  experience: [newExperience()], education: [newEducation()], projects: [], skills: '', certifications: '',
});

export const sampleResume = (): ResumeData => ({
  name: 'Asha Verma',
  headline: 'Customer Support Executive',
  email: 'asha.verma@example.com',
  phone: '+91 98765 43210',
  location: 'Pune, India',
  links: 'linkedin.com/in/ashaverma-example',
  summary: 'Support executive with 3 years of experience resolving customer queries by chat and email. Known for clear writing, calm handling of escalations and keeping response times low.',
  experience: [
    { id: uid(), role: 'Customer Support Executive', company: 'Brightline Services', location: 'Pune', start: '2023-01', end: '', current: true,
      bullets: 'Resolved 60+ chat and email tickets a day with a 94% satisfaction score\nReduced average first response time from 9 minutes to 4 minutes by writing reusable replies\nTrained 5 new joiners on the ticketing tool and escalation rules' },
    { id: uid(), role: 'Support Associate', company: 'Nova Telecom', location: 'Mumbai', start: '2021-06', end: '2022-12', current: false,
      bullets: 'Handled 40 calls a day and closed 88% of issues on the first contact\nDocumented 15 common faults in the team knowledge base' },
  ],
  education: [{ id: uid(), degree: 'B.Com', school: 'Savitribai Phule Pune University', location: 'Pune', start: '2018', end: '2021', details: 'First class' }],
  projects: [],
  skills: 'Customer service, Email support, Zendesk, Ticket triage, Typing 55 wpm, English, Hindi, Marathi',
  certifications: 'Customer Service Fundamentals (online course), 2022',
});

export const splitLines = (text: string): string[] => text.split(/\r?\n/).map((line) => line.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean);
export const splitSkills = (text: string): string[] => text.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2022-03' -> 'Mar 2022'; '2022' stays '2022'; anything else is returned as typed. */
export function formatMonth(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value.trim();
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${match[1]}` : value;
}

export function formatRange(start: string, end: string, current: boolean): string {
  const from = formatMonth(start);
  const to = current ? 'Present' : formatMonth(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

const ACTION_VERBS = new Set(['achieved', 'analysed', 'analyzed', 'built', 'created', 'delivered', 'designed', 'developed', 'drove', 'improved', 'increased', 'launched', 'led', 'managed', 'organised', 'organized', 'reduced', 'resolved', 'saved', 'trained', 'wrote', 'implemented', 'handled', 'coordinated', 'supported', 'documented', 'streamlined', 'negotiated', 'maintained', 'prepared', 'processed', 'planned', 'sold', 'taught', 'tested', 'automated', 'cut', 'grew', 'won', 'ran', 'opened', 'closed', 'secured', 'mentored', 'introduced', 'redesigned', 'generated', 'monitored', 'audited', 'configured', 'deployed', 'fixed', 'collaborated', 'presented', 'owned', 'scaled', 'simplified', 'recruited', 'onboarded', 'booked', 'cleaned', 'served', 'operated']);
const WEAK_PHRASES = [/responsible for/i, /worked on/i, /helped with/i, /duties included/i, /assisted in/i];

export interface Finding { level: 'good' | 'warn' | 'fix'; text: string }
export interface ResumeCheck { words: number; findings: Finding[]; score: number }

const wordCount = (text: string) => (text.trim() === '' ? 0 : text.trim().split(/\s+/).length);

/** Resume wording and completeness checklist. It is a guide to common recruiter and parser expectations, not a simulation of any particular ATS. */
export function analyseResume(resume: ResumeData): ResumeCheck {
  const findings: Finding[] = [];
  const add = (level: Finding['level'], text: string) => findings.push({ level, text });

  const bullets = resume.experience.flatMap((item) => splitLines(item.bullets));
  const projectLines = resume.projects.flatMap((item) => splitLines(item.details));
  const skills = splitSkills(resume.skills);
  const summaryWords = wordCount(resume.summary);
  const words = wordCount([
    resume.name, resume.headline, resume.summary, resume.skills, resume.certifications,
    ...resume.experience.flatMap((item) => [item.role, item.company, item.bullets]),
    ...resume.education.flatMap((item) => [item.degree, item.school, item.details]),
    ...resume.projects.flatMap((item) => [item.name, item.details]),
  ].join(' '));

  if (!resume.name.trim()) add('fix', 'Add your name.');
  if (!resume.email.trim()) add('fix', 'Add an email address recruiters can reply to.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email.trim())) add('fix', 'The email address does not look valid.');
  if (!resume.phone.trim()) add('warn', 'Add a phone number.');
  if (!resume.name.trim() || !resume.email.trim()) { /* already reported */ } else add('good', 'Name and email are present.');

  if (summaryWords === 0) add('warn', 'A two or three line summary helps a recruiter decide quickly.');
  else if (summaryWords < 20) add('warn', `Your summary is very short (${summaryWords} words). Aim for about 30 to 70.`);
  else if (summaryWords > 90) add('warn', `Your summary is long (${summaryWords} words). Aim for about 30 to 70.`);
  else add('good', 'The summary is a good length.');

  const filledJobs = resume.experience.filter((item) => item.role.trim() || item.company.trim());
  if (filledJobs.length === 0 && resume.projects.length === 0) add('warn', 'Add work experience, internships or projects.');
  filledJobs.forEach((item) => {
    const label = item.role.trim() || item.company.trim();
    if (!item.start.trim()) add('warn', `Add a start date for "${label}".`);
    const count = splitLines(item.bullets).length;
    if (count === 0) add('warn', `Add bullet points for "${label}" (3 to 6 work well).`);
    else if (count > 7) add('warn', `"${label}" has ${count} bullets. Keep the strongest 4 to 6.`);
  });

  const all = [...bullets, ...projectLines];
  if (all.length > 0) {
    const verbStart = all.filter((line) => ACTION_VERBS.has(line.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ''))).length;
    if (verbStart / all.length < 0.6) add('warn', `Only ${verbStart} of ${all.length} bullets start with a strong action verb such as "Led", "Built" or "Reduced".`);
    else add('good', 'Most bullets start with an action verb.');
    const withNumbers = all.filter((line) => /\d/.test(line)).length;
    if (withNumbers / all.length < 0.3) add('warn', `Only ${withNumbers} of ${all.length} bullets contain a number. Add counts, percentages, money or time saved where you honestly can.`);
    else add('good', 'Several bullets include numbers.');
    const long = all.filter((line) => wordCount(line) > 30).length;
    if (long > 0) add('warn', `${long} bullet${long === 1 ? ' is' : 's are'} over 30 words. Shorter lines are easier to scan.`);
    const weak = all.filter((line) => WEAK_PHRASES.some((pattern) => pattern.test(line))).length;
    if (weak > 0) add('warn', `${weak} bullet${weak === 1 ? ' uses' : 's use'} weak phrases like "responsible for" or "worked on". Say what you did and the result.`);
    const firstPerson = all.filter((line) => /^i\s|\bmy\b/i.test(line)).length;
    if (firstPerson > 0) add('warn', `${firstPerson} bullet${firstPerson === 1 ? ' is' : 's are'} written in the first person. Resumes usually drop "I" and "my".`);
  }

  if (skills.length === 0) add('warn', 'Add a skills section; many recruiters search by skill.');
  else if (skills.length < 5) add('warn', 'Add more skills (at least 5 relevant ones).');
  else add('good', `${skills.length} skills listed.`);

  if (!resume.education.some((item) => item.degree.trim() || item.school.trim())) add('warn', 'Add your education, even if it is school or a short course.');

  if (words > 900) add('warn', `About ${words} words is long. One page is often enough for under 10 years of experience.`);
  else if (words < 100) add('warn', `About ${words} words is thin. Add detail about what you did.`);
  else add('good', `About ${words} words, a reasonable length.`);

  const fixes = findings.filter((item) => item.level === 'fix').length;
  const warns = findings.filter((item) => item.level === 'warn').length;
  const order = { fix: 0, warn: 1, good: 2 } as const;
  findings.sort((a, b) => order[a.level] - order[b.level]);
  return { words, findings, score: Math.max(0, 100 - fixes * 15 - warns * 6) };
}

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const list = <T,>(value: unknown, make: (raw: Record<string, unknown>) => T): T[] => (Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').slice(0, 30).map((item) => make(item as Record<string, unknown>)) : []);

/** Rebuild a resume from untrusted JSON (a saved or imported file), keeping only the known text fields. */
export function coerceResume(input: unknown): ResumeData {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return {
    name: str(raw.name), headline: str(raw.headline), email: str(raw.email), phone: str(raw.phone), location: str(raw.location),
    links: str(raw.links), summary: str(raw.summary), skills: str(raw.skills), certifications: str(raw.certifications),
    experience: list(raw.experience, (item) => ({ id: uid(), role: str(item.role), company: str(item.company), location: str(item.location), start: str(item.start), end: str(item.end), current: item.current === true, bullets: str(item.bullets) })),
    education: list(raw.education, (item) => ({ id: uid(), degree: str(item.degree), school: str(item.school), location: str(item.location), start: str(item.start), end: str(item.end), details: str(item.details) })),
    projects: list(raw.projects, (item) => ({ id: uid(), name: str(item.name), link: str(item.link), details: str(item.details) })),
  };
}
