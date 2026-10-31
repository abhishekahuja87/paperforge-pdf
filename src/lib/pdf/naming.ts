/**
 * Generates clean, unique, and descriptive download file names.
 * Format: [clean-base-name]_[tool]_[details]_[timestamp].pdf
 */
export function generatePdfFilename(
  originalFileName: string,
  toolName: string,
  details?: string
): string {
  // Strip extension and special characters
  const base = originalFileName
    .replace(/\.pdf$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '_')
    .slice(0, 30);

  const cleanTool = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanDetails = details
    ? `_${details.toLowerCase().replace(/[^a-z0-9-_]/g, '-')}`
    : '';

  // Timestamp format: YYYYMMDD_HHMMSS
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `${base || 'document'}_${cleanTool}${cleanDetails}_${timestamp}.pdf`;
}