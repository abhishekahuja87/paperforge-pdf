import type { DocStyle } from './docStyle';

/** Ready-made starting points. The words in [square brackets] are placeholders to replace. They are samples of layout, not legal or financial advice. */
export interface DocTemplate {
  id: string;
  label: string;
  hint: string;
  style?: Partial<DocStyle>;
  header?: string;
  footer?: string;
  watermark?: string;
  html: string;
}

const table = (rows: string[][], header = true, extra = '') =>
  `<table class="sd-table ${extra}"><tbody>${rows.map((row, at) => `<tr>${row.map((cell) => (header && at === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`)).join('')}</tr>`).join('')}</tbody></table>`;

export const TEMPLATES: DocTemplate[] = [
  { id: 'blank', label: 'Blank page', hint: 'Start from nothing', html: '<p><br></p>' },
  {
    id: 'letter', label: 'Formal letter', hint: 'Sender, date, body, signature', style: { theme: 'classic', accent: '#334155' },
    html: `<p>[Your name]<br>[Your address line]<br>[City, PIN code]</p><p>[Date]</p><p>To,<br>[Recipient name]<br>[Recipient address]</p><p><b>Subject: [What this letter is about]</b></p><p>Dear [Name],</p><p>[Write the first paragraph here. Say why you are writing in one or two sentences.]</p><p>[Add the details the reader needs: dates, amounts, what you ask them to do.]</p><p>[Close politely and say what happens next.]</p><p>Yours sincerely,</p><p class="sd-sign">[Your name]</p>`,
  },
  {
    id: 'notice', label: 'Notice or announcement', hint: 'Title, key facts, a highlighted note', style: { theme: 'business', accent: '#be123c' },
    html: `<p class="sd-title">[Notice title]</p><p class="sd-subtitle">[One line saying who it is for]</p><p>[Write what is happening and why, in a short paragraph.]</p><h2>Key details</h2>${table([['What', '[Describe]'], ['When', '[Date and time]'], ['Where', '[Place]'], ['Contact', '[Name and phone]']], false, 'sd-lines')}<div class="sd-callout sd-warn"><p><b>Please note:</b> [Anything people must do or bring.]</p></div><p class="sd-sign">[Name and role]</p>`,
  },
  {
    id: 'offer', label: 'Offer or appointment letter', hint: 'Role, terms table, acceptance line', style: { theme: 'business', accent: '#1d4ed8' }, watermark: '',
    footer: 'Confidential. Meant only for the person named above.',
    html: `<p class="sd-title">Offer of appointment</p><p class="sd-subtitle">[Company name]</p><p>[Date]</p><p>Dear [Candidate name],</p><p>We are pleased to offer you the position of <b>[Job title]</b> at [Company name]. This letter sets out the main terms. Please read it carefully.</p><h2>Terms</h2>${table([['Item', 'Details'], ['Position', '[Job title]'], ['Reporting to', '[Manager]'], ['Start date', '[Date]'], ['Place of work', '[Location]'], ['Pay', '[Amount and how often it is paid]'], ['Notice period', '[Period]']])}<p>[Add any other terms, or say that a full agreement will follow.]</p><p>Please confirm by signing below and returning a copy by [date].</p><p class="sd-sign">For [Company name]</p><p class="sd-sign">Accepted: [Candidate name], date</p>`,
  },
  {
    id: 'quotation', label: 'Quotation or estimate', hint: 'Items table with amounts', style: { theme: 'modern', accent: '#0f766e' },
    html: `<p class="sd-title">Quotation</p><p class="sd-subtitle">[Your business name] · [Phone] · [Email]</p>${table([['Quotation no.', '[Number]'], ['Date', '[Date]'], ['Prepared for', '[Customer name]'], ['Valid until', '[Date]']], false, 'sd-lines')}<h2>Items</h2>${table([['#', 'Description', 'Qty', 'Rate', 'Amount'], ['1', '[Item or service]', '[1]', '[0]', '[0]'], ['2', '[Item or service]', '[1]', '[0]', '[0]'], ['3', '[Item or service]', '[1]', '[0]', '[0]'], ['', '<b>Total</b>', '', '', '<b>[0]</b>']], true, 'sd-striped')}<p>[Say whether taxes are included or extra, and how payment is made.]</p><div class="sd-callout sd-info"><p><b>Terms:</b> [Delivery time, payment terms, anything else the customer should know.]</p></div><p class="sd-sign">[Your name]</p>`,
  },
  {
    id: 'details', label: 'Confidential details sheet', hint: 'Names, ID and account details in a table', style: { theme: 'modern', accent: '#334155' }, watermark: 'Confidential',
    html: `<p class="sd-title">Details sheet</p><p class="sd-subtitle">For [Recipient]. Shared on [date].</p><h2>Personal</h2>${table([['Full name', '[Name]'], ['Date of birth', '[Date]'], ['Phone', '[Number]'], ['Address', '[Address]']], false)}<h2>Bank</h2>${table([['Account holder', '[Name]'], ['Bank and branch', '[Bank, branch]'], ['Account number', '[Number]'], ['IFSC', '[Code]']], false)}<div class="sd-callout sd-warn"><p>Use these details only for [purpose]. Please delete the file after use.</p></div>`,
  },
  {
    id: 'minutes', label: 'Meeting minutes', hint: 'Attendees, decisions, action items', style: { theme: 'business', accent: '#7e22ce' },
    html: `<p class="sd-title">Meeting minutes</p><p class="sd-subtitle">[Meeting name]</p>${table([['Date', '[Date and time]'], ['Place', '[Place or link]'], ['Present', '[Names]'], ['Absent', '[Names]']], false, 'sd-lines')}<h2>Agenda</h2><ol><li>[Topic]</li><li>[Topic]</li><li>[Topic]</li></ol><h2>Decisions</h2><ul><li>[Decision]</li><li>[Decision]</li></ul><h2>Action items</h2>${table([['Action', 'Owner', 'Due'], ['[What must be done]', '[Name]', '[Date]'], ['[What must be done]', '[Name]', '[Date]']], true, 'sd-striped')}<p>Next meeting: [date]</p>`,
  },
  {
    id: 'report', label: 'Report or proposal', hint: 'Title, summary, headed sections', style: { theme: 'elegant', accent: '#0f766e' },
    html: `<p class="sd-title">[Report title]</p><p class="sd-subtitle">[Prepared for] · [Date]</p><p class="sd-lead">[Two or three sentences that give the whole story: the problem, what you found, what you suggest.]</p><h1>Summary</h1><p>[Key points in a short paragraph or three bullets.]</p><h1>Background</h1><p>[What the reader needs to know first.]</p><h1>Findings</h1><h2>[First finding]</h2><p>[Explain it, with numbers if you have them.]</p><h2>[Second finding]</h2><p>[Explain it.]</p><h1>Recommendation</h1><ul><li>[What to do first]</li><li>[What to do next]</li></ul>`,
  },
  {
    id: 'handover', label: 'Handover or instructions', hint: 'Steps, a checklist and contacts', style: { theme: 'modern', accent: '#c2410c' },
    html: `<p class="sd-title">Handover note</p><p class="sd-subtitle">[Topic] · from [Name] to [Name]</p><p>[A line on what this covers and why.]</p><h2>Checklist</h2><ul class="sd-check"><li>[First thing to do]</li><li>[Second thing to do]</li><li>[Third thing to do]</li></ul><h2>How it works</h2><ol><li>[Step one]</li><li>[Step two]</li><li>[Step three]</li></ol><div class="sd-callout sd-danger"><p><b>Be careful:</b> [The one thing that must not go wrong.]</p></div><h2>Contacts</h2>${table([['Who', 'For what', 'Phone'], ['[Name]', '[Topic]', '[Number]']], true, 'sd-lines')}`,
  },
];

export const templateById = (id: string): DocTemplate => TEMPLATES.find((item) => item.id === id) ?? TEMPLATES[0]!;
