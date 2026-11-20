import { INK, clamp, drawLogo, fillRect, fitText, flag, line, lines, makePages, num, pageBox, str, text, wrap, type Ctx } from './draw';
import { FONTS } from './theme';
import { drawQr } from './qr';
import { wifiPayload } from '../qr/payloads';
import type { Family, SheetDef } from './types';

const bandOf = (c: Ctx) => (c.fill ? c.accent : '#222222');
const dashed = (c: Ctx, x1: number, y: number, x2: number) => c.items.push({ t: 'line', x1, y1: y, x2, y2: y, w: c.weight * 0.8, c: '#888888', dash: [0.6, 0.9] });
const cell = (raw: string) => raw.split('|').map((p) => p.trim());

/** ID cards, 85.6 by 54 mm, as many per page as fit: a coloured top band with the name of the school or business and a logo, a photo box, and typed or blank details. */
const idCards: SheetDef = {
  id: 'id-card-maker-printable', label: 'ID cards', hint: 'Photo ID cards, several per page', path: '/id-card-maker-printable', landscape: false,
  fields: [
    { type: 'list', key: 'people', label: 'People (optional)', hint: 'One per line: Name | Class or role | ID number. Up to 40. Leave empty for blank cards.', max: 40 },
    { type: 'text', key: 'valid', label: 'Valid until (optional)', placeholder: 'March 2027', max: 24 },
    { type: 'text', key: 'contact', label: 'Address or phone on the card (optional)', placeholder: 'Sunrise Public School, Pune', max: 60 },
    { type: 'select', key: 'style', label: 'Card style', options: [{ value: 'band', label: 'Colour band on top' }, { value: 'side', label: 'Colour stripe on the left' }] },
    { type: 'toggle', key: 'photo', label: 'Box for a photo', hint: 'Print the card, then stick a passport photo in the box.' },
    { type: 'toggle', key: 'sign', label: 'Signature line for the issuing person' },
    { type: 'number', key: 'blanks', label: 'Blank cards (when no people are typed)', min: 1, max: 4, step: 1, unit: 'pages' },
  ],
  defaults: { people: '', valid: '', contact: '', style: 'band', photo: true, sign: true, blanks: 1 },
  build: (v, common) => {
    const W = 85.6; const H = 54; const gap = 3;
    const box = pageBox(common);
    const cols = Math.max(1, Math.floor((box.w + gap) / (W + gap))); const rows = Math.max(1, Math.floor((box.h + gap) / (H + gap)));
    const per = cols * rows;
    const people = lines(v, 'people', 40).map(cell);
    const pages = people.length > 0 ? Math.ceil(people.length / per) : clamp(num(v, 'blanks', 1), 1, 4);
    const side = str(v, 'style') === 'side'; const photo = flag(v, 'photo');
    return makePages(common, pages, (c, pi) => {
      const x0 = c.x + (c.w - (cols * W + (cols - 1) * gap)) / 2;
      for (let k = 0; k < per; k += 1) {
        const x = x0 + (k % cols) * (W + gap); const y = c.y + Math.floor(k / cols) * (H + gap);
        const person = people.length > 0 ? people[pi * per + k] : []; if (!person) continue;
        const band = bandOf(c);
        const head = c.heading.trim();
        const left = side ? 12 : 0;
        if (side) fillRect(c, x, y, 9, H, band); else fillRect(c, x, y, W, 12, band);
        let hx = x + (side ? 12 : 2.5);
        if (c.logo) { const lw = side ? 0 : 15; if (!side) { fillRect(c, x + 1.5, y + 1.5, lw, 9, '#ffffff'); drawLogo(c, x + 2, y + 2, lw - 1, 8, 'middle'); hx = x + 18; } else drawLogo(c, x + 12, y + 2, 14, 9); }
        if (head) fitText(c, hx + (side && c.logo ? 15 : 0), y + (side ? 6 : 7.6), W - (hx - x) - 3 - (side && c.logo ? 15 : 0), 8, head, side ? 9.5 : 10.5, true, 'start', side ? bandOf(c) : '#ffffff');
        // outline
        line(c, x, y, x + W, y); line(c, x + W, y, x + W, y + H); line(c, x + W, y + H, x, y + H); line(c, x, y + H, x, y);
        const top = y + (side ? 14 : 15.5);
        let tx = x + left + 4;
        if (photo) {
          const px = x + left + 4; const pw = 21; const ph = 27;
          line(c, px, top, px + pw, top, c.weight); line(c, px + pw, top, px + pw, top + ph, c.weight); line(c, px + pw, top + ph, px, top + ph, c.weight); line(c, px, top + ph, px, top, c.weight);
          text(c, px + pw / 2, top + ph / 2 + 1, 6.5, 'Photo', false, 'middle', '#999999');
          tx = px + pw + 4;
        }
        const tw = x + W - 3 - tx;
        const [name = '', role = '', id = ''] = person;
        if (people.length > 0) {
          fitText(c, tx, top + 6, tw, 12, name, 12.5, true, 'start', INK);
          if (role) fitText(c, tx, top + 14, tw, 6, role, 9, false, 'start', '#333333');
          if (id) text(c, tx, top + 21, 8.5, `ID: ${id}`, true, 'start', INK);
        } else {
          ['Name', 'Class / Role', 'ID No.'].forEach((label, i) => { const ly = top + 7 + i * 8; text(c, tx, ly, 7.5, label, true, 'start', '#444444'); line(c, tx + label.length * 1.7 + 2, ly + 0.8, tx + tw, ly + 0.8, c.weight * 0.8); });
        }
        const foot = y + H - 3;
        const valid = str(v, 'valid');
        if (valid) text(c, x + left + 4, foot, 6.8, `Valid until: ${valid}`, false, 'start', '#444444');
        if (flag(v, 'sign')) { line(c, x + W - 28, foot - 3.2, x + W - 4, foot - 3.2, c.weight * 0.8); text(c, x + W - 16, foot, 5.8, 'Issuing authority', false, 'middle', '#666666'); }
        const contact = str(v, 'contact');
        if (contact) fitText(c, x + left + 4, foot - 5, W - left - 36, 3, contact, 6, false, 'start', '#555555');
      }
    });
  },
};

const UPI_OK = /^[A-Za-z0-9._-]{2,}@[A-Za-z][A-Za-z0-9.-]{1,}$/;

/** A counter sign with a UPI QR code. The code carries only the UPI ID, the name and an optional amount that you type. */
const upiStand: SheetDef = {
  id: 'upi-payment-qr-stand-printable', label: 'UPI QR stand', hint: 'Scan and pay sign for a counter', path: '/upi-payment-qr-stand-printable', landscape: false,
  fields: [
    { type: 'text', key: 'upi', label: 'Your UPI ID', placeholder: 'sharmastores@bank', max: 50 },
    { type: 'text', key: 'payee', label: 'Name shown when paying', placeholder: 'Sharma Stores', max: 40 },
    { type: 'text', key: 'amount', label: 'Fixed amount (optional)', placeholder: 'Leave empty to let the payer type it', max: 10 },
    { type: 'text', key: 'tagline', label: 'Line under the code', placeholder: 'Scan with any UPI app', max: 50 },
    { type: 'toggle', key: 'showId', label: 'Print the UPI ID under the code' },
    { type: 'number', key: 'pages', label: 'Copies', min: 1, max: 6, step: 1, unit: 'copies' },
  ],
  defaults: { upi: '', payee: '', amount: '', tagline: 'Scan with any UPI app', showId: true, pages: 1 },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 6), (c) => {
    const cx = c.x + c.w / 2;
    const upi = str(v, 'upi'); const payee = str(v, 'payee') || c.heading.trim();
    fillRect(c, c.x, c.y, c.w, 26, bandOf(c));
    if (c.logo) { fillRect(c, c.x + 3, c.y + 3, 24, 20, '#ffffff'); drawLogo(c, c.x + 4, c.y + 4, 22, 18, 'middle'); }
    const head = c.heading.trim();
    if (head) fitText(c, c.x + (c.logo ? 30 : 6), c.y + 16.5, c.w - (c.logo ? 36 : 12), 14, head, 24, true, c.logo ? 'start' : 'middle', '#ffffff');
    text(c, cx, c.y + 48, 34, 'SCAN & PAY', true, 'middle', c.accent);
    const size = Math.min(c.w * 0.78, c.h * 0.52);
    const qx = cx - size / 2; const qy = c.y + 58;
    const valid = UPI_OK.test(upi);
    if (valid) {
      const amount = str(v, 'amount').replace(/[^0-9.]/g, '');
      const link = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(payee || 'Payee')}&cu=INR${amount ? `&am=${amount}` : ''}`;
      drawQr(c, qx, qy, size, link);
      line(c, qx - 2, qy - 2, qx + size + 2, qy - 2, c.weight * 2, bandOf(c)); line(c, qx + size + 2, qy - 2, qx + size + 2, qy + size + 2, c.weight * 2, bandOf(c));
      line(c, qx + size + 2, qy + size + 2, qx - 2, qy + size + 2, c.weight * 2, bandOf(c)); line(c, qx - 2, qy + size + 2, qx - 2, qy - 2, c.weight * 2, bandOf(c));
    } else {
      c.items.push({ t: 'line', x1: qx, y1: qy, x2: qx + size, y2: qy, w: c.weight, c: '#999999', dash: [2, 2] }); c.items.push({ t: 'line', x1: qx + size, y1: qy, x2: qx + size, y2: qy + size, w: c.weight, c: '#999999', dash: [2, 2] });
      c.items.push({ t: 'line', x1: qx + size, y1: qy + size, x2: qx, y2: qy + size, w: c.weight, c: '#999999', dash: [2, 2] }); c.items.push({ t: 'line', x1: qx, y1: qy + size, x2: qx, y2: qy, w: c.weight, c: '#999999', dash: [2, 2] });
      fitText(c, qx + 6, qy + size / 2, size - 12, 20, upi ? 'That UPI ID does not look right. It should look like name@bank.' : 'Type your UPI ID and the QR code appears here.', 11, false, 'middle', '#777777');
    }
    let y = qy + size + 14;
    text(c, cx, y, 15, str(v, 'tagline') || 'Scan with any UPI app', true, 'middle', INK); y += 9;
    if (valid && flag(v, 'showId')) { fitText(c, c.x + 10, y, c.w - 20, 8, upi, 14, true, 'middle', '#333333'); y += 9; }
    if (payee) { fitText(c, c.x + 10, y, c.w - 20, 8, payee, 12, false, 'middle', '#333333'); y += 8; }
    fitText(c, c.x + 10, c.y + c.h - 4, c.w - 20, 6, 'Check the name shown in your app before you pay.', 9, false, 'middle', '#777777');
  }),
};

/** A Wi-Fi sign: network name, password and a QR code phones can scan to join. */
const wifiSign: SheetDef = {
  id: 'wifi-password-sign-printable', label: 'Wi-Fi sign', hint: 'Network, password and QR code', path: '/wifi-password-sign-printable', landscape: false,
  fields: [
    { type: 'text', key: 'ssid', label: 'Network name', placeholder: 'SunriseCafe', max: 32 },
    { type: 'text', key: 'password', label: 'Password', placeholder: 'welcome123', max: 63 },
    { type: 'select', key: 'security', label: 'Security', options: [{ value: 'WPA', label: 'Password (WPA or WPA2)' }, { value: 'nopass', label: 'Open, no password' }] },
    { type: 'toggle', key: 'showPass', label: 'Print the password in words' },
    { type: 'text', key: 'note', label: 'Message (optional)', placeholder: 'Please be kind to our network', max: 60 },
  ],
  defaults: { ssid: '', password: '', security: 'WPA', showPass: true, note: '' },
  build: (v, common) => makePages(common, 1, (c) => {
    const cx = c.x + c.w / 2;
    const ssid = str(v, 'ssid'); const open = str(v, 'security') === 'nopass'; const pass = String(v.password ?? '');
    const head = c.heading.trim();
    if (c.logo) drawLogo(c, cx - 20, c.y, 40, 22, 'middle');
    if (head) fitText(c, c.x + 10, c.y + (c.logo ? 32 : 14), c.w - 20, 10, head, 20, true, 'middle', INK);
    text(c, cx, c.y + 62, 52, 'Wi-Fi', true, 'middle', c.accent);
    line(c, cx - 30, c.y + 68, cx + 30, c.y + 68, c.weight * 3, bandOf(c));
    const size = Math.min(c.w * 0.62, c.h * 0.36); const qx = cx - size / 2; const qy = c.y + 78;
    if (ssid) { drawQr(c, qx, qy, size, wifiPayload({ ssid, password: pass, security: open ? 'nopass' : 'WPA', hidden: false })); }
    else fitText(c, qx, qy + size / 2, size, 20, 'Type your network name and the QR code appears here.', 11, false, 'middle', '#777777');
    text(c, cx, qy + size + 8, 11, 'Point your phone camera at the code to join', false, 'middle', '#555555');
    let y = qy + size + 24;
    text(c, c.x + 14, y, 12, 'Network', false, 'start', '#555555'); fitText(c, c.x + 50, y, c.w - 64, 10, ssid || '________', 24, true, 'start', INK); y += 18;
    if (!open) { text(c, c.x + 14, y, 12, 'Password', false, 'start', '#555555'); if (flag(v, 'showPass')) fitText(c, c.x + 50, y, c.w - 64, 10, pass || '________', 24, true, 'start', INK); else text(c, c.x + 50, y, 24, '(ask us)', false, 'start', '#777777'); y += 18; }
    else { text(c, c.x + 14, y, 12, 'No password needed', true, 'start', INK); y += 18; }
    const note = str(v, 'note'); if (note) fitText(c, c.x + 10, y + 6, c.w - 20, 8, note, 13, false, 'middle', '#444444');
  }),
};

/** A one-page menu or price list in one or two columns with section headings and dotted lines to the price. */
const menuCard: SheetDef = {
  id: 'restaurant-menu-card-printable', label: 'Menu card', hint: 'Menu or price list with sections', path: '/restaurant-menu-card-printable', landscape: false,
  fields: [
    { type: 'text', key: 'tagline', label: 'Line under the name (optional)', placeholder: 'Fresh and homemade since 2012', max: 60 },
    { type: 'list', key: 'items', label: 'Menu items', hint: 'One per line: Item | price | short description (optional). A line starting with # is a section heading, such as #Starters. Up to 70 lines.', max: 70 },
    { type: 'text', key: 'currency', label: 'Before each price (optional)', placeholder: 'Rs. ', max: 6 },
    { type: 'select', key: 'columns', label: 'Columns', options: [{ value: '1', label: 'One column' }, { value: '2', label: 'Two columns' }] },
    { type: 'text', key: 'footer', label: 'Line at the bottom (optional)', placeholder: 'Please tell us about any food allergies', max: 80 },
  ],
  defaults: { tagline: '', items: '#Starters\nVegetable samosa | 40 | Two pieces with chutney\nPaneer tikka | 180\n#Main course\nDal tadka | 150\nJeera rice | 110\n#Drinks\nMasala chai | 25\nFresh lime soda | 50', currency: '', columns: '1', footer: '' },
  build: (v, common) => {
    const box = pageBox(common);
    const two = str(v, 'columns') === '2';
    const colGap = 8; const colW = two ? (box.w - colGap) / 2 : box.w;
    type Row = { kind: 'h' | 'i'; name: string; price: string; desc: string };
    const rows: Row[] = lines(v, 'items', 70).map((raw) => {
      if (raw.startsWith('#')) return { kind: 'h' as const, name: raw.replace(/^#+\s*/, ''), price: '', desc: '' };
      const [name = '', price = '', desc = ''] = cell(raw);
      return { kind: 'i' as const, name, price, desc };
    });
    const headerH = 44; const footerH = str(v, 'footer') ? 12 : 0;
    const rowH = (r: Row) => (r.kind === 'h' ? 13 : r.desc ? 11.5 : 7.5);
    const pagesOfCols: Row[][][] = [[[]]];
    let page = 0; let col = 0; let used = 0;
    const avail = (p: number) => box.h - (p === 0 ? headerH : 8) - footerH;
    for (const r of rows) {
      const h = rowH(r);
      if (used + h > avail(page)) { used = 0; if (two && col === 0) { col = 1; pagesOfCols[page]!.push([]); } else { page += 1; col = 0; pagesOfCols.push([[]]); } }
      pagesOfCols[page]![col]!.push(r); used += h;
    }
    const cur = str(v, 'currency');
    return makePages(common, pagesOfCols.length, (c, pi) => {
      const cx = c.x + c.w / 2;
      let top = c.y + 6;
      if (pi === 0) {
        const head = c.heading.trim();
        if (c.logo) drawLogo(c, cx - 14, c.y, 28, 13, 'middle');
        if (head) fitText(c, c.x + 6, c.y + (c.logo ? 22 : 12), c.w - 12, 12, head, 26, true, 'middle', c.accent);
        const tag = str(v, 'tagline'); if (tag) text(c, cx, c.y + (c.logo ? 29 : 20), 11, tag, false, 'middle', '#555555');
        line(c, c.x + 20, c.y + 35, c.x + c.w - 20, c.y + 35, c.weight * 2, bandOf(c));
        top = c.y + headerH;
      } else top = c.y + 8;
      (pagesOfCols[pi] ?? []).forEach((colRows, ci) => {
        const x = c.x + ci * (colW + colGap); let y = top;
        for (const r of colRows) {
          if (r.kind === 'h') {
            if (c.fill) { fillRect(c, x, y - 4, colW, 8, bandOf(c)); text(c, x + 2, y + 1.6, 11, r.name.toUpperCase(), true, 'start', '#ffffff'); }
            else { text(c, x, y + 1.6, 11.5, r.name.toUpperCase(), true, 'start', INK); line(c, x, y + 3.2, x + colW, y + 3.2, c.weight * 1.6); }
            y += 13; continue;
          }
          const priceText = r.price ? `${cur}${r.price}` : '';
          const pw = priceText.length * 11 * c.cw + 2;
          fitText(c, x, y, colW - pw - 6, 5, r.name, 11, true, 'start', INK);
          if (priceText) { text(c, x + colW, y, 11, priceText, true, 'end', INK); const nameW = Math.min(colW - pw - 6, r.name.length * 11 * c.cw); if (colW - pw - nameW > 8) dashed(c, x + nameW + 2, y - 0.6, x + colW - pw - 1); }
          if (r.desc) { fitText(c, x, y + 4.6, colW, 4, r.desc, 8.5, false, 'start', '#666666'); y += 11.5; } else y += 7.5;
        }
      });
      const foot = str(v, 'footer'); if (foot && pi === pagesOfCols.length - 1) { fitText(c, c.x + 6, c.y + c.h - 3, c.w - 12, 6, foot, 9.5, false, 'middle', '#555555'); }
    });
  },
};

/** A question paper: header block, name and roll lines, sections, numbered questions with marks, multiple choice options, answer lines and an optional answer key page. */
const testPaper: SheetDef = {
  id: 'question-paper-template-printable', label: 'Question paper', hint: 'Test paper with marks and answer lines', path: '/question-paper-template-printable', landscape: false,
  fields: [
    { type: 'text', key: 'exam', label: 'Exam or test name', placeholder: 'Unit Test 1', max: 50 },
    { type: 'text', key: 'subject', label: 'Subject', placeholder: 'Science', max: 30 },
    { type: 'text', key: 'klass', label: 'Class', placeholder: 'Class 6', max: 20 },
    { type: 'text', key: 'time', label: 'Time allowed', placeholder: '1 hour', max: 20 },
    { type: 'text', key: 'instructions', label: 'Instructions (optional)', placeholder: 'Answer all questions.', max: 160 },
    { type: 'list', key: 'questions', label: 'Questions', hint: 'One per line. Add marks at the end like [2]. Multiple choice: Question | option | option | option | option =b (the =b gives the key). A line starting with # is a section heading. Up to 60 lines.', max: 60 },
    { type: 'number', key: 'answerLines', label: 'Answer lines under each written question', min: 0, max: 8, step: 1, unit: 'lines' },
    { type: 'toggle', key: 'nameBox', label: 'Name, roll number and date line' },
    { type: 'toggle', key: 'key', label: 'Add an answer key page (uses the =b on multiple choice lines)' },
  ],
  defaults: { exam: 'Unit Test 1', subject: '', klass: '', time: '', instructions: 'Answer all questions.', questions: '#Section A: Choose the right answer\nWhich planet is known as the Red Planet? | Venus | Mars | Jupiter | Saturn =b [1]\nWater boils at 100 degrees Celsius at sea level. | True | False =a [1]\n#Section B: Short answers\nWhat is photosynthesis? [2]\nName any two states of matter. [2]', answerLines: 2, nameBox: true, key: false },
  build: (v, common) => {
    const box = pageBox(common);
    const cw = FONTS[common.font ?? 'sans'].cw;
    const size = 11; const perLine = Math.max(20, Math.floor((box.w - 18) / (size * cw)));
    type Q = { kind: 'h' | 'q'; text: string; marks: number; opts: string[]; answer: string; n: number };
    let n = 0;
    const qs: Q[] = lines(v, 'questions', 60).map((raw): Q => {
      if (raw.startsWith('#')) return { kind: 'h', text: raw.replace(/^#+\s*/, ''), marks: 0, opts: [], answer: '', n: 0 };
      const markM = raw.match(/\[(\d{1,3})\]\s*$/); const marks = markM ? Number(markM[1]) : 0;
      let body = markM ? raw.slice(0, markM.index).trim() : raw;
      const ansM = body.match(/=\s*([a-eA-E])\s*$/); const answer = ansM ? ansM[1]!.toLowerCase() : ''; if (ansM) body = body.slice(0, ansM.index).trim();
      const [question = '', ...opts] = cell(body);
      n += 1; return { kind: 'q', text: question, marks, opts: opts.filter(Boolean).slice(0, 5), answer, n };
    });
    const total = qs.reduce((a, q) => a + q.marks, 0);
    const lineCount = clamp(num(v, 'answerLines', 2), 0, 8);
    const heightOf = (q: Q) => {
      if (q.kind === 'h') return 12;
      const text = wrap(q.text, perLine).length * 5.4;
      const optsH = q.opts.length ? (q.opts.every((o) => o.length < 18) ? 5.6 : q.opts.length * 5.4) : lineCount * 7.5;
      return text + optsH + 3.5;
    };
    const first = 54 + (str(v, 'instructions') ? 8 : 0);
    const pages: Q[][] = [[]]; let used = 0; let pgi = 0;
    for (const q of qs) {
      const h = heightOf(q); const room = box.h - (pgi === 0 ? first : 0);
      if (used + h > room && pages[pgi]!.length > 0) { pages.push([]); pgi += 1; used = 0; }
      pages[pgi]!.push(q); used += h;
    }
    const keyed = flag(v, 'key') && qs.some((q) => q.answer);
    return makePages(common, pages.length + (keyed ? 1 : 0), (c, pi) => {
      const cx = c.x + c.w / 2;
      if (pi >= pages.length) {
        text(c, cx, c.y + 10, 16, 'Answer key', true, 'middle', c.accent);
        qs.filter((q) => q.kind === 'q').forEach((q, i) => { const col = Math.floor(i / 20); const row = i % 20; text(c, c.x + 10 + col * 45, c.y + 24 + row * 8, 11, `${q.n}.   ${q.answer ? q.answer.toUpperCase() : '-'}`, false, 'start', INK); });
        return;
      }
      let y = c.y;
      if (pi === 0) {
        if (c.logo) drawLogo(c, c.x, c.y, 24, 14);
        const head = c.heading.trim();
        if (head) fitText(c, c.x + (c.logo ? 26 : 0), c.y + 8, c.w - (c.logo ? 52 : 0), 10, head, 18, true, 'middle', c.accent);
        const title = [str(v, 'exam'), str(v, 'subject')].filter(Boolean).join(' - ');
        if (title) fitText(c, c.x, c.y + 17, c.w, 8, title, 13, true, 'middle', INK);
        text(c, c.x, c.y + 26, 10, [str(v, 'klass'), str(v, 'time') ? `Time: ${str(v, 'time')}` : ''].filter(Boolean).join('     '), false, 'start', '#333333');
        text(c, c.x + c.w, c.y + 26, 10, `Maximum marks: ${total || '____'}`, true, 'end', INK);
        line(c, c.x, c.y + 29, c.x + c.w, c.y + 29, c.weight * 2, bandOf(c));
        if (flag(v, 'nameBox')) { ['Name', 'Roll no.', 'Date'].forEach((lab, i) => { const x = c.x + [0, c.w * 0.58, c.w * 0.8][i]!; const w = [c.w * 0.55, c.w * 0.19, c.w * 0.2][i]!; text(c, x, c.y + 40, 9, `${lab}:`, true, 'start', INK); line(c, x + lab.length * 1.9 + 4, c.y + 40.8, x + w, c.y + 40.8, c.weight * 0.8); }); }
        const ins = str(v, 'instructions'); if (ins) fitText(c, c.x, c.y + 50, c.w, 7, `Instructions: ${ins}`, 9.5, false, 'start', '#444444');
        y = c.y + first;
      }
      for (const q of pages[pi]!) {
        if (q.kind === 'h') { if (c.fill) { fillRect(c, c.x, y - 1, c.w, 8, c.tint); } text(c, c.x + 1.5, y + 4.6, 11.5, q.text, true, 'start', c.accent); y += 12; continue; }
        const wrapped = wrap(q.text, perLine);
        text(c, c.x, y + 4, size, `${q.n}.`, true, 'start', INK);
        wrapped.forEach((ln, i) => text(c, c.x + 9, y + 4 + i * 5.4, size, ln, false, 'start', INK));
        if (q.marks) text(c, c.x + c.w, y + 4, 10, `[${q.marks}]`, true, 'end', '#333333');
        y += wrapped.length * 5.4;
        if (q.opts.length) {
          const short = q.opts.every((o) => o.length < 18);
          if (short) { const step = (c.w - 12) / q.opts.length; q.opts.forEach((o, i) => text(c, c.x + 9 + i * step, y + 4, 10, `(${String.fromCharCode(97 + i)}) ${o}`, false, 'start', '#222222')); y += 5.6; }
          else q.opts.forEach((o, i) => { fitText(c, c.x + 12, y + 4, c.w - 14, 5, `(${String.fromCharCode(97 + i)}) ${o}`, 10, false, 'start', '#222222'); y += 5.4; });
        } else for (let i = 0; i < lineCount; i += 1) { y += 7.5; line(c, c.x + 9, y - 1, c.x + c.w, y - 1, c.weight * 0.8, '#999999'); }
        y += 3.5;
      }
      text(c, c.x + c.w, c.y + c.h, 8, `Page ${pi + 1} of ${pages.length}`, false, 'end', '#777777');
    });
  },
};

export const SHOPDOC_FAMILY: Family = {
  key: 'shopdoc',
  headingLabel: 'School, shop or business name',
  headingPlaceholder: 'Sunrise Public School  or  Sharma Stores',
  note: 'These are templates for your own use. ID cards, stamps and certificates made here are not official documents; check what your school, office or bank accepts. The UPI code holds only the ID, name and amount you type, so check it by scanning with your own app before you put it up.',
  sheets: [idCards, upiStand, wifiSign, menuCard, testPaper],
};
