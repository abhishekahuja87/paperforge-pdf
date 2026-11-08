/** Turns pdf-lib's raw "cannot encode" message into advice a visitor can act on. */
export function friendlyFontError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/WinAnsi|cannot encode|cannot be encoded/i.test(message)) {
    return new Error('The text contains characters (for example Hindi, Chinese or emoji) that the built-in PDF fonts cannot draw. Use English letters, numbers and common symbols.');
  }
  return error instanceof Error ? error : new Error(message);
}
