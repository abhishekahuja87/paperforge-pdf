/** Explains what a scanned QR code contains in plain words, so nothing is opened or paid without a look. */
export type QrKind = 'upi' | 'wifi' | 'link' | 'phone' | 'email' | 'sms' | 'contact' | 'location' | 'text';
export interface QrDetail { label: string; value: string }
export interface QrInfo { kind: QrKind; title: string; details: QrDetail[]; /** Set only for web links the person may choose to open. */ href?: string; warning?: string }

const wifiField = (body: string, key: string): string => {
  const match = new RegExp(`(?:^|;)${key}:((?:\\\\.|[^;\\\\])*)`).exec(body);
  return match ? match[1]!.replace(/\\(.)/g, '$1') : '';
};

export function parseQr(raw: string): QrInfo {
  const text = raw.trim();
  const lower = text.toLowerCase();
  if (lower.startsWith('upi://')) {
    let params = new URLSearchParams();
    try { params = new URL(text).searchParams; } catch { /* keep empty */ }
    const details: QrDetail[] = [];
    const add = (label: string, key: string) => { const value = params.get(key); if (value) details.push({ label, value }); };
    add('Pay to (UPI ID)', 'pa'); add('Name', 'pn'); add('Amount', 'am'); add('Note', 'tn');
    return { kind: 'upi', title: 'UPI payment QR', details, warning: 'Check the name and UPI ID match the person or shop you mean to pay before you pay from your UPI app. This tool does not make any payment.' };
  }
  if (lower.startsWith('wifi:')) {
    const body = text.slice(5);
    const details: QrDetail[] = [];
    const name = wifiField(body, 'S'); const pass = wifiField(body, 'P'); const type = wifiField(body, 'T');
    if (name) details.push({ label: 'Network name', value: name });
    if (pass) details.push({ label: 'Password', value: pass });
    details.push({ label: 'Security', value: type && type !== 'nopass' ? type : 'None' });
    return { kind: 'wifi', title: 'Wi-Fi network', details };
  }
  if (/^https?:\/\//i.test(text)) {
    let host = '';
    try { host = new URL(text).hostname; } catch { /* leave empty */ }
    const odd = host.startsWith('xn--') || host.includes('.xn--') || /^\d+\.\d+\.\d+\.\d+$/.test(host);
    return { kind: 'link', title: 'Web link', details: host ? [{ label: 'Website', value: host }] : [], href: host ? text : undefined, warning: odd ? 'This address looks unusual (an IP address or a look-alike spelling). Do not enter passwords or card details on it.' : 'Check the website name above before you open it. Do not enter passwords or card details on a site you did not expect.' };
  }
  if (lower.startsWith('tel:')) return { kind: 'phone', title: 'Phone number', details: [{ label: 'Number', value: text.slice(4) }] };
  if (lower.startsWith('mailto:')) return { kind: 'email', title: 'Email address', details: [{ label: 'To', value: text.slice(7).split('?')[0]! }] };
  if (lower.startsWith('smsto:') || lower.startsWith('sms:')) {
    const parts = text.slice(text.indexOf(':') + 1).split(':');
    return { kind: 'sms', title: 'Text message', details: [{ label: 'Number', value: parts[0] ?? '' }, ...(parts[1] ? [{ label: 'Message', value: parts.slice(1).join(':') }] : [])] };
  }
  if (lower.startsWith('geo:')) return { kind: 'location', title: 'Map location', details: [{ label: 'Coordinates', value: text.slice(4).split('?')[0]! }] };
  if (lower.startsWith('begin:vcard')) {
    const get = (key: string) => new RegExp(`^${key}[^:]*:(.*)$`, 'im').exec(text)?.[1]?.trim() ?? '';
    const details: QrDetail[] = [];
    for (const [label, key] of [['Name', 'FN'], ['Phone', 'TEL'], ['Email', 'EMAIL'], ['Company', 'ORG']] as const) { const value = get(key); if (value) details.push({ label, value }); }
    return { kind: 'contact', title: 'Contact card', details };
  }
  return { kind: 'text', title: 'Text', details: [] };
}
