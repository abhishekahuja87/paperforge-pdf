/** Small helpers for the document editor: tables, pictures, font sizes and block styles. They work on the editor's own element, so they can be tested without React. */

export const closest = (node: Node | null, root: HTMLElement, selector: string): HTMLElement | null => {
  let at: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  while (at && at !== root) {
    if (at.matches(selector)) return at;
    at = at.parentElement;
  }
  return null;
};

export const BLOCKS = 'p,h1,h2,h3,h4,h5,h6,div,blockquote,pre,li';

/** The text of the document without tags, for counting words. */
export function wordCount(root: HTMLElement): number {
  const text = (root.innerText || root.textContent || '').trim();
  return text ? text.split(/\s+/).length : 0;
}

export function tableHtml(rows: number, cols: number, header: boolean): string {
  const cell = (tag: 'td' | 'th') => `<${tag}><br></${tag}>`;
  const row = (tag: 'td' | 'th') => `<tr>${Array.from({ length: cols }, () => cell(tag)).join('')}</tr>`;
  const body = Array.from({ length: rows }, (_, at) => row(header && at === 0 ? 'th' : 'td')).join('');
  return `<table class="sd-table"><tbody>${body}</tbody></table><p><br></p>`;
}

const blankCell = (tag: string) => {
  const cell = document.createElement(tag);
  cell.innerHTML = '<br>';
  return cell;
};

export function addRow(cell: HTMLTableCellElement, below: boolean): void {
  const row = cell.parentElement as HTMLTableRowElement;
  const copy = document.createElement('tr');
  Array.from(row.cells).forEach(() => copy.appendChild(blankCell('td')));
  row.parentElement!.insertBefore(copy, below ? row.nextSibling : row);
}

export function addColumn(cell: HTMLTableCellElement, right: boolean): void {
  const at = cell.cellIndex;
  const table = cell.closest('table') as HTMLTableElement;
  Array.from(table.rows).forEach((row) => {
    const near = row.cells[at];
    const fresh = blankCell(near?.tagName === 'TH' ? 'th' : 'td');
    if (near) row.insertBefore(fresh, right ? near.nextSibling : near);
    else row.appendChild(fresh);
  });
}

export function deleteRow(cell: HTMLTableCellElement): void {
  const table = cell.closest('table') as HTMLTableElement;
  cell.parentElement?.remove();
  if (!table.rows.length) table.remove();
}

export function deleteColumn(cell: HTMLTableCellElement): void {
  const at = cell.cellIndex;
  const table = cell.closest('table') as HTMLTableElement;
  Array.from(table.rows).forEach((row) => row.cells[at]?.remove());
  if (!table.rows[0]?.cells.length) table.remove();
}

/** Turns the first row into a header row (bold, shaded) or back into a normal row. */
export function toggleHeaderRow(table: HTMLTableElement): void {
  const first = table.rows[0];
  if (!first) return;
  const makeHeader = !Array.from(first.cells).every((cell) => cell.tagName === 'TH');
  Array.from(first.cells).forEach((cell) => {
    const swap = document.createElement(makeHeader ? 'th' : 'td');
    Array.from(cell.attributes).forEach((attribute) => swap.setAttribute(attribute.name, attribute.value));
    swap.innerHTML = cell.innerHTML;
    cell.replaceWith(swap);
  });
}

/** Sets the table look: `grid` (all borders), `lines` (rows only) or `plain`, and the striped option. */
export function setTableLook(table: HTMLTableElement, look: 'grid' | 'lines' | 'plain', striped: boolean): void {
  table.className = ['sd-table', look === 'lines' ? 'sd-lines' : look === 'plain' ? 'sd-plain' : '', striped ? 'sd-striped' : ''].filter(Boolean).join(' ');
}

export function tableLook(table: HTMLTableElement): { look: 'grid' | 'lines' | 'plain'; striped: boolean; header: boolean } {
  return {
    look: table.classList.contains('sd-plain') ? 'plain' : table.classList.contains('sd-lines') ? 'lines' : 'grid',
    striped: table.classList.contains('sd-striped'),
    header: !!table.rows[0] && Array.from(table.rows[0].cells).every((cell) => cell.tagName === 'TH'),
  };
}

/** Scales a picture down (longest side `max` pixels) and returns it as a small data address, so it can live inside the document. */
export async function fitImage(file: File, max = 1600): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error('Choose a PNG, JPG, WebP or GIF picture.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const picture = new Image();
      picture.onload = () => resolve(picture);
      picture.onerror = () => reject(new Error('That picture could not be read.'));
      picture.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot resize pictures.');
    context.drawImage(img, 0, 0, width, height);
    if (file.type === 'image/png') {
      const png = canvas.toDataURL('image/png');
      if (png.length < 700_000) return png;
    }
    // Photos and large PNGs are saved as JPEG on a white background, which is much smaller.
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sets the size of the selected text in pixels. The browser only offers 7 sizes, so it marks the text with the biggest one and this swaps in the real size. */
export function setFontSize(root: HTMLElement, pixels: number): void {
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand('fontSize', false, '7');
  root.querySelectorAll<HTMLElement>('font[size="7"], span[style*="xxx-large"]').forEach((node) => {
    const span = node.tagName === 'FONT' ? document.createElement('span') : node;
    if (span !== node) {
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    }
    span.removeAttribute('size');
    span.style.fontSize = `${pixels}px`;
  });
}

export type BlockChoice = 'p' | 'title' | 'subtitle' | 'lead' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote' | 'pre';
const TEXT_CLASSES = ['sd-title', 'sd-subtitle', 'sd-lead'];

/** Makes the current paragraph a heading, title, quote and so on. */
export function setBlock(root: HTMLElement, choice: BlockChoice): void {
  const tag = choice === 'title' || choice === 'subtitle' || choice === 'lead' ? 'p' : choice;
  document.execCommand('formatBlock', false, tag);
  const selection = window.getSelection();
  const block = selection?.anchorNode ? closest(selection.anchorNode, root, 'p,h1,h2,h3,h4,h5,h6,blockquote,pre') : null;
  if (!block) return;
  block.classList.remove(...TEXT_CLASSES);
  if (choice === 'title' || choice === 'subtitle' || choice === 'lead') block.classList.add(`sd-${choice}`);
  if (!block.getAttribute('class')) block.removeAttribute('class');
}

/** What the current paragraph is, for the style menu. */
export function currentBlock(root: HTMLElement): BlockChoice {
  const selection = window.getSelection();
  const block = selection?.anchorNode ? closest(selection.anchorNode, root, 'p,h1,h2,h3,h4,h5,h6,blockquote,pre') : null;
  if (!block) return 'p';
  if (block.classList.contains('sd-title')) return 'title';
  if (block.classList.contains('sd-subtitle')) return 'subtitle';
  if (block.classList.contains('sd-lead')) return 'lead';
  const tag = block.tagName.toLowerCase();
  return (['h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'] as const).find((t) => t === tag) ?? 'p';
}

/** Turns the current bullet list into a list with check boxes, or back. */
export function toggleChecklist(root: HTMLElement): void {
  const selection = window.getSelection();
  let list = selection?.anchorNode ? closest(selection.anchorNode, root, 'ul') : null;
  if (!list) {
    document.execCommand('insertUnorderedList');
    list = selection?.anchorNode ? closest(selection.anchorNode, root, 'ul') : null;
  }
  list?.classList.toggle('sd-check');
  if (list && !list.getAttribute('class')) list.removeAttribute('class');
}
