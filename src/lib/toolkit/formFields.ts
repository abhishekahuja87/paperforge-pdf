import type { PDFDocument as PdfDoc } from 'pdf-lib';

/** The fillable fields a PDF form carries inside the file (text boxes, tick boxes, drop-down lists, radio buttons). */
export type FieldKind = 'text' | 'check' | 'choice';
export interface FormFieldInfo {
  name: string;
  kind: FieldKind;
  options: string[];
  /** Starting text or chosen option. */
  value: string;
  checked: boolean;
  maxLength: number | null;
}
export interface FieldEntry { value: string; checked: boolean }

export const MAX_FIELDS = 120;

/** Lists the fillable fields in a PDF, or an empty list when it has none or cannot be read. Read-only and signature fields are skipped. */
export async function readFormFields(bytes: ArrayBuffer): Promise<FormFieldInfo[]> {
  try {
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } = await import('pdf-lib');
    const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false, updateMetadata: false });
    const out: FormFieldInfo[] = [];
    for (const field of doc.getForm().getFields()) {
      if (out.length >= MAX_FIELDS) break;
      if (field.isReadOnly()) continue;
      const name = field.getName();
      if (field instanceof PDFTextField) out.push({ name, kind: 'text', options: [], value: field.getText() ?? '', checked: false, maxLength: field.getMaxLength() ?? null });
      else if (field instanceof PDFCheckBox) out.push({ name, kind: 'check', options: [], value: '', checked: field.isChecked(), maxLength: null });
      else if (field instanceof PDFDropdown) out.push({ name, kind: 'choice', options: field.getOptions(), value: field.getSelected()[0] ?? '', checked: false, maxLength: null });
      else if (field instanceof PDFRadioGroup) out.push({ name, kind: 'choice', options: field.getOptions(), value: field.getSelected() ?? '', checked: false, maxLength: null });
      else if (field instanceof PDFOptionList) out.push({ name, kind: 'choice', options: field.getOptions(), value: field.getSelected()[0] ?? '', checked: false, maxLength: null });
    }
    return out;
  } catch {
    return [];
  }
}

/** Writes the typed values into the form fields. Only fields whose value changed from the original are touched. */
export async function applyFormFields(doc: PdfDoc, original: FormFieldInfo[], entries: Record<string, FieldEntry>, flatten: boolean): Promise<number> {
  const { PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList, StandardFonts } = await import('pdf-lib');
  const form = doc.getForm();
  let changed = 0;
  for (const info of original) {
    const entry = entries[info.name];
    if (!entry) continue;
    const field = form.getFieldMaybe(info.name);
    if (!field) continue;
    if (field instanceof PDFTextField && entry.value !== info.value) { field.setText(entry.value || undefined); changed += 1; }
    else if (field instanceof PDFCheckBox && entry.checked !== info.checked) { if (entry.checked) field.check(); else field.uncheck(); changed += 1; }
    else if ((field instanceof PDFDropdown || field instanceof PDFRadioGroup || field instanceof PDFOptionList) && entry.value && entry.value !== info.value) { field.select(entry.value); changed += 1; }
  }
  if (changed > 0 || flatten) {
    form.updateFieldAppearances(await doc.embedFont(StandardFonts.Helvetica));
    if (flatten) form.flatten();
  }
  return changed;
}
