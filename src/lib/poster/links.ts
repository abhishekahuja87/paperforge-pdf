/** Web links for the QR codes on a poster, built from what the shop typed in the contact boxes. */

const isLink = (text: string) => /^(https?:\/\/|(www\.)?(facebook|fb|instagram|wa)\.(com|me)\/)/i.test(text.trim());
const withProtocol = (text: string) => (/^https?:\/\//i.test(text) ? text : `https://${text}`);

/** wa.me link. A number without + and 10 digits or fewer gets `countryCode` in front (a leading 0 is dropped). */
export function whatsappLink(number: string, countryCode = ''): string {
  const text = number.trim();
  if (!text) return '';
  let digits = text.replace(/\D/g, '');
  if (!digits) return '';
  const code = countryCode.replace(/\D/g, '');
  if (!text.startsWith('+') && !text.startsWith('00') && code && digits.length <= 10) digits = `${code}${digits.replace(/^0+/, '')}`;
  return `https://wa.me/${digits.replace(/^00/, '')}`;
}

export function facebookLink(text: string): string {
  const value = text.trim();
  if (!value) return '';
  if (isLink(value)) return withProtocol(value);
  return `https://www.facebook.com/${value.replace(/^@/, '').replace(/^\/+/, '')}`;
}

export function instagramLink(text: string): string {
  const value = text.trim();
  if (!value) return '';
  if (isLink(value)) return withProtocol(value);
  return `https://www.instagram.com/${value.replace(/^@/, '').replace(/^\/+/, '')}/`;
}
