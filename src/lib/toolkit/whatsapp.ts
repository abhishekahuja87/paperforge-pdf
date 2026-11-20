export interface Country { code: string; name: string; dial: string }

/** Dialling codes for the countries most visitors use. */
export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'US', name: 'United States / Canada', dial: '1' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'NP', name: 'Nepal', dial: '977' },
  { code: 'BD', name: 'Bangladesh', dial: '880' },
  { code: 'LK', name: 'Sri Lanka', dial: '94' },
  { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'DE', name: 'Germany', dial: '49' },
];

export interface WhatsappLink { link: string; digits: string }

/** A wa.me chat link from a country code, a local number and an optional first message. */
export function buildWhatsappLink(dial: string, local: string, message: string): WhatsappLink {
  const number = local.replace(/\D/g, '').replace(/^0+/, '');
  const digits = `${dial.replace(/\D/g, '')}${number}`;
  if (!number) throw new Error('Type the phone number.');
  if (digits.length < 8 || digits.length > 15) throw new Error('A phone number with the country code is 8 to 15 digits. Check the number.');
  const text = message.trim();
  return { digits, link: `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}` };
}
