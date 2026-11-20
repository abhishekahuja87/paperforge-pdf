/**
 * Locks and opens data with a password, using only the browser's own WebCrypto. The password is stretched with
 * PBKDF2-SHA-256 (many rounds, a random salt) into a 256-bit key, and the data is sealed with AES-256-GCM, which
 * also detects any change to the file. Nothing here is custom cryptography.
 */

/** Rounds of PBKDF2. High on purpose: it slows down anyone guessing passwords from a copy of the file. The number is stored in the file, so it can change later. */
export const ITERATIONS = 1_200_000;

export interface Sealed {
  /** Format version. */
  v: 1;
  /** PBKDF2 rounds used. */
  i: number;
  /** Salt, base64. */
  s: string;
  /** AES-GCM nonce, base64. */
  n: string;
  /** Sealed data (ciphertext and tag), base64. */
  c: string;
}

/** What is stored in front of the data, once it is sealed too. `m`: doc, file or html. */
export interface Header {
  m: 'doc' | 'file' | 'html';
  /** Title or file name. */
  t?: string;
  /** Original file name (file mode). */
  n?: string;
  /** Media type (file mode). */
  y?: string;
  /** CSS for the document (doc mode). */
  c?: string;
}

const encoder = new TextEncoder();

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let at = 0; at < binary.length; at += 1) bytes[at] = binary.charCodeAt(at);
  return bytes;
}

const normalise = (password: string) => password.normalize('NFKC');
const aad = (rounds: number) => encoder.encode(`mdu1|${rounds}`);

async function deriveKey(password: string, salt: Uint8Array, rounds: number, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(normalise(password)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: rounds, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

/** Joins the header and the data into one block: 4 bytes for the header length, the header as JSON, then the data. */
export function pack(header: Header, body: Uint8Array): Uint8Array {
  const head = encoder.encode(JSON.stringify(header));
  const out = new Uint8Array(4 + head.length + body.length);
  new DataView(out.buffer).setUint32(0, head.length);
  out.set(head, 4);
  out.set(body, 4 + head.length);
  return out;
}

export function unpack(plain: Uint8Array): { header: Header; body: Uint8Array } {
  const length = new DataView(plain.buffer, plain.byteOffset, plain.byteLength).getUint32(0);
  const header = JSON.parse(new TextDecoder().decode(plain.subarray(4, 4 + length))) as Header;
  return { header, body: plain.subarray(4 + length) };
}

/** Seals data with a password. A new random salt and nonce are made every time. */
export async function seal(plain: Uint8Array, password: string, rounds: number = ITERATIONS): Promise<Sealed> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, rounds, 'encrypt');
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource, additionalData: aad(rounds) as BufferSource }, key, plain as BufferSource));
  return { v: 1, i: rounds, s: toBase64(salt), n: toBase64(nonce), c: toBase64(sealed) };
}

/** Opens sealed data. Throws if the password is wrong or the data was changed. */
export async function open(sealed: Sealed, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password, fromBase64(sealed.s), sealed.i, 'decrypt');
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(sealed.n) as BufferSource, additionalData: aad(sealed.i) as BufferSource }, key, fromBase64(sealed.c) as BufferSource));
}
