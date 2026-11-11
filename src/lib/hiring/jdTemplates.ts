/**
 * Job description templates. Each one sets the look (header style, font, colour) and the starter wording for
 * every section. `{title}` and `{company}` in the text are replaced with the real role and company on output.
 */
import type { ResumeFont } from '../careers/resumeTemplates';

export type JdHeader = 'plain' | 'band' | 'bar';

export interface JdSections {
  summary: string;
  responsibilities: string;
  requirements: string;
  nice: string;
  benefits: string;
  apply: string;
  equal: string;
}

export type JdSectionKey = keyof JdSections;

export interface JdTemplateSpec {
  id: string;
  name: string;
  blurb: string;
  font: ResumeFont;
  header: JdHeader;
  accent: string;
  sections: JdSections;
}

const APPLY = 'Send your resume and a short note about why you are interested in the {title} role to the email address above, with the job title in the subject line. We will reply to shortlisted candidates within two weeks.';
const EQUAL = '{company} is an equal opportunity employer. We welcome applications from everyone and make hiring decisions on skills and experience, without regard to gender, religion, caste, age, disability or background.';

export const JD_TEMPLATES: JdTemplateSpec[] = [
  {
    id: 'corporate', name: 'Corporate', blurb: 'Formal, for established companies', font: 'serif', header: 'plain', accent: '#1e3a5f',
    sections: {
      summary: '{company} is looking for a {title} to join our team. You will work with colleagues across the business, take ownership of your area and help us deliver reliable results for our customers.',
      responsibilities: 'Plan and carry out the day-to-day work of the role to agreed targets and deadlines\nPrepare accurate reports and share progress with your manager each week\nWork with other teams to solve problems and improve how we do things\nKeep clear records and follow company policies and procedures\nSupport new team members and share what you learn',
      requirements: 'Bachelor\'s degree or equivalent experience in a relevant field\nProven experience in a similar role\nStrong written and spoken communication\nGood organisation and attention to detail\nComfortable with Excel, email and common office tools',
      nice: 'Experience in our industry\nProfessional certification\nExperience working with senior stakeholders',
      benefits: 'Competitive salary reviewed every year\nHealth insurance and paid leave\nProvident fund and gratuity as per law\nTraining and career growth\nA friendly, professional workplace',
      apply: APPLY, equal: EQUAL,
    },
  },
  {
    id: 'startup', name: 'Startup', blurb: 'Friendly and energetic', font: 'humanist', header: 'band', accent: '#ea580c',
    sections: {
      summary: 'We are {company}, a small team doing big things. As our {title} you will have real ownership from day one, work closely with the founders and see the result of your work every week.',
      responsibilities: 'Own your area end to end, from idea to launch\nTry things quickly, learn from what works and drop what does not\nWork directly with founders and customers\nWear more than one hat when the team needs it\nHelp us build good habits as we grow',
      requirements: 'Curious, hands-on and happy to figure things out\nExperience in a similar role, or a strong portfolio of projects\nClear communication and a sense of ownership\nComfortable with change and fast decisions',
      nice: 'Experience at an early-stage company\nA side project we can look at\nInterest in our product or market',
      benefits: 'Real ownership and a voice in decisions\nFlexible hours\nLearning budget\nA fair salary, with the chance to grow with the company\nA small, supportive team',
      apply: APPLY, equal: EQUAL,
    },
  },
  {
    id: 'technical', name: 'Technical', blurb: 'For engineering and IT roles', font: 'sans', header: 'bar', accent: '#0f766e',
    sections: {
      summary: '{company} is hiring a {title} to design, build and maintain reliable software. You will work with a small engineering team, review each other\'s code and ship improvements often.',
      responsibilities: 'Design, build, test and maintain features and services\nWrite clean, readable code and review teammates\' code\nFind and fix bugs and performance problems\nWrite and keep documentation up to date\nTake part in planning, estimates and retrospectives\nSuggest better tools and practices',
      requirements: 'Solid experience with the main languages and tools of the role\nUnderstanding of data structures, APIs and databases\nExperience with Git and code review\nComfortable writing automated tests\nClear written communication',
      nice: 'Experience with cloud platforms and CI/CD\nContributions to open source\nExperience mentoring other engineers',
      benefits: 'Competitive salary and yearly review\nHealth insurance\nLatest laptop and equipment\nBudget for books, courses and conferences\nFlexible working hours',
      apply: 'Send your resume and a link to your GitHub profile or portfolio to the email address above, with the job title in the subject line. Shortlisted candidates will get a short technical conversation and a practical task.', equal: EQUAL,
    },
  },
  {
    id: 'sales', name: 'Sales', blurb: 'Targets, incentives and growth', font: 'sans', header: 'band', accent: '#be123c',
    sections: {
      summary: '{company} is growing and needs a {title} who enjoys meeting people, understanding what they need and closing deals. You will own your targets and be rewarded for what you achieve.',
      responsibilities: 'Find new customers and keep in touch with existing ones\nPresent our products and services and answer questions with confidence\nPrepare quotes and follow up until a decision is made\nMeet monthly and quarterly sales targets\nKeep customer records and the sales pipeline up to date\nShare feedback from the market with the team',
      requirements: 'Experience in sales or business development\nConfident, polite and persuasive communication\nWilling to travel for client meetings when needed\nBasic knowledge of CRM tools and spreadsheets\nA proven record of meeting targets',
      nice: 'Contacts in our industry\nExperience selling to businesses\nKnowledge of the local language and market',
      benefits: 'Fixed salary plus incentives on sales\nTravel and phone allowance\nHealth insurance\nRecognition and rewards for top performers\nClear path to team lead roles',
      apply: APPLY, equal: EQUAL,
    },
  },
  {
    id: 'support', name: 'Customer support', blurb: 'Helpful, patient, clear', font: 'humanist', header: 'plain', accent: '#15803d',
    sections: {
      summary: 'As {title} at {company} you will be the friendly voice our customers hear first. You will answer questions, fix problems and make sure every person leaves the conversation happier than they arrived.',
      responsibilities: 'Reply to customer calls, chats and emails politely and quickly\nFind the cause of problems and fix them, or pass them to the right team\nRecord every conversation clearly in our support system\nFollow up until the customer is satisfied\nShare common questions so we can improve our product and help pages\nMeet response time and quality targets',
      requirements: 'Clear, polite and patient communication\nGood typing speed and basic computer skills\nWillingness to work in shifts when needed\nA calm approach to difficult conversations\nPrevious customer service experience is helpful but not essential',
      nice: 'Knowledge of more than one language\nExperience with helpdesk tools\nExperience in our industry',
      benefits: 'Paid training before you start\nHealth insurance and paid leave\nShift allowance where it applies\nGrowth into senior support and team lead roles\nA supportive team',
      apply: APPLY, equal: EQUAL,
    },
  },
  {
    id: 'internship', name: 'Internship', blurb: 'For students and freshers', font: 'sans', header: 'bar', accent: '#6d28d9',
    sections: {
      summary: '{company} is offering an internship for a {title}. You will work on real projects with a mentor, learn how a team works and build experience that counts on your resume.',
      responsibilities: 'Support the team with day-to-day tasks and small projects\nResearch, collect and organise information\nLearn our tools and processes with the help of a mentor\nPresent what you have learned to the team at the end of the internship\nAsk questions and share ideas',
      requirements: 'Currently studying or recently graduated in a relevant field\nWillingness to learn and take feedback\nGood communication and time management\nBasic computer skills',
      nice: 'Projects, coursework or a portfolio related to the role\nPrevious internship or volunteering experience',
      benefits: 'Monthly stipend\nA mentor who guides your work\nCertificate of internship and a letter of recommendation\nChance of a full-time offer for strong performers\nFlexible hours around your exams',
      apply: 'Send your resume, your college name and your year of study to the email address above, with the job title in the subject line.', equal: EQUAL,
    },
  },
  {
    id: 'operations', name: 'Operations and field', blurb: 'Shop floor, retail and delivery', font: 'sans', header: 'plain', accent: '#334155',
    sections: {
      summary: '{company} needs a dependable {title} to keep our daily work running smoothly. This is a hands-on role for someone who is punctual, careful and happy to work with a team.',
      responsibilities: 'Complete daily tasks on time and as instructed\nKeep the work area clean, safe and organised\nCheck stock, orders or deliveries and record them correctly\nFollow safety and quality rules\nReport problems to the supervisor straight away\nHelp colleagues during busy periods',
      requirements: 'Minimum 10th or 12th pass, or equivalent experience\nPunctual and reliable\nAble to stand, walk or lift as the role needs\nBasic reading, writing and counting skills\nWillingness to work shifts or weekends when needed',
      nice: 'Previous experience in a similar job\nValid driving licence\nBasic smartphone skills',
      benefits: 'Fixed monthly salary paid on time\nOvertime pay\nProvident fund and ESI as per law\nUniform or safety equipment\nPaid weekly off and leave',
      apply: 'Call or message us on the phone number above, or send your details to the email address above. Please carry your ID proof and any experience letters when you come for the interview.', equal: EQUAL,
    },
  },
  {
    id: 'creative', name: 'Creative', blurb: 'Design, content and media', font: 'serif', header: 'band', accent: '#db2777',
    sections: {
      summary: '{company} is looking for a {title} with a good eye and a love of making things. You will turn ideas into work people notice, from first sketch to finished piece.',
      responsibilities: 'Turn briefs into clear, attractive work\nCome up with fresh ideas and present them to the team\nAdapt your work after feedback, on time\nKeep our look and tone consistent across everything we publish\nKeep up with trends and tools in your field\nOrganise your files so others can pick up the work',
      requirements: 'A portfolio that shows your range and your thinking\nExperience with the main tools of your craft\nStrong sense of layout, colour, language or sound, depending on the role\nAbility to work to deadlines and take feedback well\nClear communication with writers, developers and clients',
      nice: 'Experience in motion, video or photography\nBasic knowledge of web and social media formats\nExperience working with clients directly',
      benefits: 'Creative freedom on real projects\nFlexible hours\nSoftware and equipment provided\nBudget for courses and events\nA team that values good work',
      apply: 'Send your portfolio link and resume to the email address above, with the job title in the subject line. Please show two or three pieces you are proud of and tell us your part in each.', equal: EQUAL,
    },
  },
];

export const DEFAULT_JD_TEMPLATE = 'corporate';
export const getJdTemplate = (id: string): JdTemplateSpec => JD_TEMPLATES.find((item) => item.id === id) ?? JD_TEMPLATES[0];
export const isJdTemplateId = (id: unknown): id is string => typeof id === 'string' && JD_TEMPLATES.some((item) => item.id === id);

export const JD_SECTION_ORDER: { key: JdSectionKey; label: string; bullets: boolean }[] = [
  { key: 'summary', label: 'About the role', bullets: false },
  { key: 'responsibilities', label: 'What you will do', bullets: true },
  { key: 'requirements', label: 'What we are looking for', bullets: true },
  { key: 'nice', label: 'Nice to have', bullets: true },
  { key: 'benefits', label: 'What we offer', bullets: true },
  { key: 'apply', label: 'How to apply', bullets: false },
  { key: 'equal', label: 'Equal opportunity', bullets: false },
];

export interface JdDetails {
  title: string;
  company: string;
  location: string;
  type: string;
  mode: string;
  experience: string;
  salary: string;
  contact: string;
}

export const JD_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
export const JD_MODES = ['On-site', 'Hybrid', 'Remote'];

export const SAMPLE_JD: JdDetails = {
  title: 'Marketing Executive',
  company: 'Brightside Studio',
  location: 'Bengaluru, Karnataka',
  type: 'Full-time',
  mode: 'Hybrid',
  experience: '2-4 years',
  salary: '',
  contact: 'careers@brightside.example',
};

/** Replaces {title} and {company} with the real values (or sensible words when empty). */
export function fillText(text: string, d: JdDetails): string {
  return text.replace(/\{title\}/g, d.title.trim() || 'this role').replace(/\{company\}/g, d.company.trim() || 'our company');
}

export const toBullets = (text: string): string[] => text.split('\n').map((item) => item.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean);

export const metaLine = (d: JdDetails): string[] => [d.location, d.type, d.mode, d.experience && `Experience: ${d.experience}`, d.salary && `Salary: ${d.salary}`].filter((item): item is string => Boolean(item && item.trim()));

/** Plain text version for job portals, WhatsApp and email. */
export function jdPlainText(d: JdDetails, sections: JdSections): string {
  const out: string[] = [d.title.trim() || 'Job description'];
  if (d.company.trim()) out.push(d.company.trim());
  const meta = metaLine(d);
  if (meta.length) out.push(meta.join(' | '));
  for (const section of JD_SECTION_ORDER) {
    const raw = fillText(sections[section.key], d).trim();
    if (!raw) continue;
    out.push('', section.label.toUpperCase());
    if (section.bullets) out.push(...toBullets(raw).map((item) => `- ${item}`));
    else out.push(raw);
  }
  if (d.contact.trim()) out.push('', `Contact: ${d.contact.trim()}`);
  return `${out.join('\n')}\n`;
}
