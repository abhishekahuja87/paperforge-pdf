import { 
  PDFDocument, 
  rgb, 
  degrees,
  StandardFonts, 
  PDFName, 
  PDFDict, 
  PDFString 
} from 'pdf-lib';

export type SampleTemplate = 
  | 'lorem' 
  | 'invoice' 
  | 'contract' 
  | 'specsheet' 
  | 'synthetic-pii' 
  | 'mixed-geometry'
  | 'minimal';

export type CorruptionMode = 
  | 'none' 
  | 'truncated-eof' 
  | 'broken-header' 
  | 'scrambled-xref';

export interface SamplePdfOptions {
  pageCount: number;
  template: SampleTemplate;
  title?: string;
  targetSizeMb?: number;
  includeImages?: boolean;
  includeBookmarks?: boolean;
  includeFormFields?: boolean;
  includeLinksAndAnnotations?: boolean;
  corruptionMode?: CorruptionMode;
}

export async function generateSamplePdf(options: SamplePdfOptions): Promise<Uint8Array> {
  const {
    pageCount,
    template,
    title = 'Sample Test Document',
    targetSizeMb = 0,
    includeImages = false,
    includeBookmarks = false,
    includeFormFields = false,
    includeLinksAndAnnotations = false,
    corruptionMode = 'none',
  } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Clean 1x1 colored pixel PNG base64 for image testing
  const mockPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const embeddedPng = includeImages
    ? await pdfDoc.embedPng(Uint8Array.from(atob(mockPngBase64), (c) => c.charCodeAt(0)))
    : null;

  const form = includeFormFields ? pdfDoc.getForm() : null;
  const totalPages = template === 'mixed-geometry' ? Math.max(pageCount, 4) : pageCount;

  for (let i = 1; i <= totalPages; i++) {
    let pageWidth = 595.28; // Standard A4
    let pageHeight = 841.89;
    let rotationAngle = 0;

    if (template === 'mixed-geometry') {
      const mode = (i - 1) % 4;
      if (mode === 0) {
        pageWidth = 595.28;
        pageHeight = 841.89;
      } else if (mode === 1) {
        pageWidth = 1190.55;
        pageHeight = 841.89;
      } else if (mode === 2) {
        pageWidth = 595.28;
        pageHeight = 841.89;
        rotationAngle = 90;
      } else {
        pageWidth = 320.0;
        pageHeight = 650.0;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    if (rotationAngle !== 0) {
      page.setRotation(degrees(rotationAngle));
    }

    // Standard Header Line
    page.drawRectangle({
      x: 35,
      y: pageHeight - 48,
      width: Math.max(pageWidth - 70, 80),
      height: 1.5,
      color: rgb(0.25, 0.3, 0.4),
    });

    page.drawText(title, {
      x: 35,
      y: pageHeight - 40,
      size: 11,
      font: fontBold,
      color: rgb(0.12, 0.15, 0.22),
    });

    page.drawText(`Page ${i} of ${totalPages}`, {
      x: Math.max(pageWidth - 100, 110),
      y: pageHeight - 40,
      size: 9,
      font,
      color: rgb(0.45, 0.5, 0.55),
    });

    // Content Body by Template
    if (template === 'minimal') {
      page.drawText('Minimal System Diagnostic File', {
        x: 35,
        y: pageHeight - 90,
        size: 14,
        font: fontBold,
        color: rgb(0.15, 0.18, 0.25),
      });
      page.drawText('Clean vector structure generated locally for ingest testing.', {
        x: 35,
        y: pageHeight - 110,
        size: 9.5,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });
      page.drawText(`Timestamp: ${new Date().toISOString()}`, {
        x: 35,
        y: pageHeight - 130,
        size: 8.5,
        font: fontMono,
        color: rgb(0.5, 0.55, 0.6),
      });
    } else if (template === 'synthetic-pii') {
      page.drawText('SYNTHETIC PII & DLP COMPLIANCE TEST DATASET', {
        x: 35,
        y: pageHeight - 85,
        size: 12,
        font: fontBold,
        color: rgb(0.7, 0.15, 0.15),
      });
      page.drawText('Generated strictly for automated redaction and regex scanner validation.', {
        x: 35,
        y: pageHeight - 102,
        size: 8.5,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });

      const records = [
        { label: 'Synthetic Cardholder', val: `Sample Test User ${i}` },
        { label: 'Mock Credit Card (Luhn)', val: `4532-7589-2345-${1000 + i}` },
        { label: 'Synthetic Taxpayer ID', val: `XXX-45-${6000 + i}` },
        { label: 'Synthetic Email Account', val: `qa-audit-user${i}@synthetic-domain.internal` },
      ];

      records.forEach((rec, idx) => {
        const rowY = pageHeight - 130 - idx * 24;
        page.drawText(rec.label + ':', { x: 35, y: rowY, size: 8.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
        page.drawText(rec.val, { x: 185, y: rowY, size: 8.5, font: fontMono, color: rgb(0.1, 0.2, 0.4) });
      });

      // Dedicated simulated redaction box
      const redactY = pageHeight - 240;
      page.drawRectangle({
        x: 35,
        y: redactY,
        width: 250,
        height: 16,
        color: rgb(0.12, 0.12, 0.12),
      });
      page.drawText('<<< OCR REDACTED STREAM >>>', { x: 50, y: redactY + 4, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    } else if (template === 'mixed-geometry') {
      const mode = (i - 1) % 4;
      const descriptions = [
        'Preset Page 1: Standard A4 Portrait (595 x 842 pt)',
        'Preset Page 2: Wide A3 Architectural Blueprint (1191 x 842 pt)',
        'Preset Page 3: Rotated 90 deg Clockwise Orientation',
        'Preset Page 4: Long POS Receipt Roll (320 x 650 pt)',
      ];

      page.drawText(descriptions[mode], {
        x: 35,
        y: pageHeight - 90,
        size: 13,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });

      page.drawText('Test whether mobile readers, printers, and thumbnail renderers adapt to varying page dimensions.', {
        x: 35,
        y: pageHeight - 110,
        size: 9,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });
    } else if (template === 'invoice') {
      page.drawText('SAMPLE INVOICE / STATEMENT', {
        x: 35,
        y: pageHeight - 85,
        size: 14,
        font: fontBold,
        color: rgb(0.18, 0.22, 0.45),
      });
      page.drawText(`Invoice #: INV-${202600 + i}  |  Issue Date: October 2026`, {
        x: 35,
        y: pageHeight - 105,
        size: 9,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });

      const startY = pageHeight - 140;
      page.drawText('Item Description', { x: 35, y: startY, size: 8.5, font: fontBold });
      page.drawText('Qty', { x: 280, y: startY, size: 8.5, font: fontBold });
      page.drawText('Unit Price', { x: 360, y: startY, size: 8.5, font: fontBold });
      page.drawText('Total', { x: 450, y: startY, size: 8.5, font: fontBold });

      page.drawLine({
        start: { x: 35, y: startY - 4 },
        end: { x: pageWidth - 35, y: startY - 4 },
        thickness: 1,
        color: rgb(0.8, 0.82, 0.88),
      });

      const lineItems = [
        { desc: 'Local WebAssembly PDF Engine Suite', qty: '1', rate: '$149.00', total: '$149.00' },
        { desc: 'Client Ingest Infrastructure Bypass', qty: '2', rate: '$75.00', total: '$150.00' },
        { desc: 'Synthetic Document Validation Sandbox', qty: '1', rate: '$210.00', total: '$210.00' },
      ];

      lineItems.forEach((item, idx) => {
        const itemY = startY - 22 - idx * 22;
        page.drawText(item.desc, { x: 35, y: itemY, size: 8.5, font });
        page.drawText(item.qty, { x: 285, y: itemY, size: 8.5, font });
        page.drawText(item.rate, { x: 360, y: itemY, size: 8.5, font });
        page.drawText(item.total, { x: 450, y: itemY, size: 8.5, font });
      });

      // Invoice Subtotal Box
      const subtotalY = startY - 100;
      page.drawRectangle({
        x: 320,
        y: subtotalY - 5,
        width: pageWidth - 355,
        height: 20,
        color: rgb(0.96, 0.97, 1),
      });
      page.drawText('Total Amount Due: $509.00', {
        x: 330,
        y: subtotalY,
        size: 9,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.45),
      });
    } else if (template === 'contract') {
      page.drawText('STANDARD MUTUAL NON-DISCLOSURE AGREEMENT', {
        x: 35,
        y: pageHeight - 85,
        size: 11.5,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.25),
      });

      const clauses = [
        '1. Purpose: The Parties evaluate technical specifications subject to client privacy.',
        '2. Confidential Information: All proprietary algorithms and local document binaries.',
        '3. Standard of Care: Receiving Party processes data strictly inside local memory sandboxes.',
        '4. Term: The covenants herein survive indefinitely for system trade secrets.',
      ];

      clauses.forEach((cl, idx) => {
        page.drawText(cl, {
          x: 35,
          y: pageHeight - 115 - idx * 34,
          size: 8.5,
          font,
          maxWidth: pageWidth - 70,
          lineHeight: 12.5,
          color: rgb(0.25, 0.28, 0.35),
        });
      });
    } else if (template === 'specsheet') {
      page.drawText('TECHNICAL COMPONENT SPECIFICATION', {
        x: 35,
        y: pageHeight - 85,
        size: 12,
        font: fontBold,
        color: rgb(0.12, 0.25, 0.4),
      });

      const specs = [
        { label: 'Architecture Target', val: 'Client-Side WASM / Chromium V8' },
        { label: 'Memory Footprint', val: '< 64 MB per invocation instance' },
        { label: 'Network Ingress/Egress', val: '0 KB (Airgapped Localhost)' },
        { label: 'Cryptographic Checksum', val: 'SHA-256 Validated Memory Block' },
      ];

      specs.forEach((sp, idx) => {
        const rowY = pageHeight - 118 - idx * 24;
        page.drawRectangle({
          x: 35,
          y: rowY - 5,
          width: pageWidth - 70,
          height: 18,
          color: idx % 2 === 0 ? rgb(0.96, 0.97, 0.99) : rgb(1, 1, 1),
        });
        page.drawText(sp.label, { x: 42, y: rowY, size: 8.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
        page.drawText(sp.val, { x: 230, y: rowY, size: 8.5, font, color: rgb(0.35, 0.4, 0.45) });
      });
    } else {
      // 'lorem' template
      page.drawText(`Section ${i}: Multi-Page Article Layout`, {
        x: 35,
        y: pageHeight - 85,
        size: 12,
        font: fontBold,
        color: rgb(0.15, 0.18, 0.25),
      });

      const paragraphs = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.',
        'Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc.',
      ];

      paragraphs.forEach((p, idx) => {
        page.drawText(p, {
          x: 35,
          y: pageHeight - 115 - idx * 52,
          size: 8.5,
          font,
          maxWidth: pageWidth - 70,
          lineHeight: 12.5,
          color: rgb(0.3, 0.35, 0.4),
        });
      });
    }

    // Interactive Annotations & Hyperlinks (Only if explicitly enabled)
    if (includeLinksAndAnnotations) {
      const annotY = 240;
      page.drawRectangle({
        x: 35,
        y: annotY - 2,
        width: 160,
        height: 12,
        color: rgb(1, 0.94, 0.4),
        opacity: 0.5,
      });
      page.drawText('Sample Highlight Annotation Layer', {
        x: 37,
        y: annotY,
        size: 7.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText('Test URL: https://example.com/test-verify', {
        x: 35,
        y: annotY - 18,
        size: 8,
        font: fontMono,
        color: rgb(0.1, 0.3, 0.8),
      });
    }

    // Embedded Sample Visual Image Box (Only if explicitly enabled, placed cleanly at the bottom)
    if (includeImages && embeddedPng) {
      const boxY = 120;
      page.drawRectangle({
        x: 35,
        y: boxY,
        width: 140,
        height: 70,
        color: rgb(0.95, 0.96, 0.98),
        borderColor: rgb(0.78, 0.82, 0.88),
        borderWidth: 1,
      });

      page.drawImage(embeddedPng, {
        x: 40,
        y: boxY + 5,
        width: 130,
        height: 60,
      });

      page.drawText('Sample Embedded Graphic Box', {
        x: 40,
        y: boxY + 74,
        size: 7,
        font: fontBold,
        color: rgb(0.35, 0.4, 0.48),
      });
    }

    // Interactive Form Fields (Only if explicitly enabled and on the last page)
    if (includeFormFields && form && i === totalPages) {
      const formY = 55;

      page.drawText('Form Testing Field:', {
        x: 35,
        y: formY + 18,
        size: 7.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.3),
      });

      const textField = form.createTextField(`test_signature_${i}`);
      textField.setText('Authorized Signatory');
      textField.addToPage(page, {
        x: 35,
        y: formY,
        width: 140,
        height: 15,
        borderWidth: 1,
        borderColor: rgb(0.65, 0.7, 0.78),
      });

      const checkField = form.createCheckBox(`test_agree_${i}`);
      checkField.check();
      checkField.addToPage(page, {
        x: 190,
        y: formY + 1,
        width: 13,
        height: 13,
      });

      page.drawText('Verified & Approved', {
        x: 210,
        y: formY + 3,
        size: 8,
        font,
        color: rgb(0.3, 0.35, 0.4),
      });
    }

    // Clean Subtle Footer
    page.drawText('Generated with MyDailyUtils - 100% In-Browser Execution', {
      x: 35,
      y: 20,
      size: 7,
      font,
      color: rgb(0.6, 0.62, 0.68),
    });
  }

  // Inject Outline / Bookmarks (Only if explicitly enabled)
  if (includeBookmarks && totalPages > 0) {
    const outlinesDict = pdfDoc.context.obj({
      Type: 'Outlines',
      Count: totalPages,
    }) as PDFDict;

    const outlinesRef = pdfDoc.context.register(outlinesDict);
    pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef);

    const pages = pdfDoc.getPages();
    let prevItemRef = null;

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const itemDict = pdfDoc.context.obj({
        Title: PDFString.of(`Section ${pIdx + 1}: Page ${pIdx + 1}`),
        Parent: outlinesRef,
        Dest: pdfDoc.context.obj([pages[pIdx].ref, PDFName.of('Fit')]),
      }) as PDFDict;

      const itemRef = pdfDoc.context.register(itemDict);

      if (pIdx === 0) outlinesDict.set(PDFName.of('First'), itemRef);
      if (pIdx === pages.length - 1) outlinesDict.set(PDFName.of('Last'), itemRef);

      if (prevItemRef) {
        const prevDict = pdfDoc.context.lookup(prevItemRef) as PDFDict;
        prevDict.set(PDFName.of('Next'), itemRef);
        itemDict.set(PDFName.of('Prev'), prevItemRef);
      }
      prevItemRef = itemRef;
    }
  }

  // Target file size padding
  if (targetSizeMb > 0) {
    const bytesNeeded = targetSizeMb * 1024 * 1024;
    const padding = new Uint8Array(bytesNeeded);
    padding.fill(65);
    pdfDoc.attach(padding, 'test_payload.dat', {
      mimeType: 'application/octet-stream',
      description: 'Size padding payload for upload capacity testing',
    });
  }

  const rawBytes = await pdfDoc.save();

  // Chaos Corruption Modes
  if (corruptionMode === 'truncated-eof') {
    const cutoff = Math.floor(rawBytes.length * 0.6);
    return rawBytes.slice(0, cutoff);
  }

  if (corruptionMode === 'broken-header') {
    const broken = new Uint8Array(rawBytes);
    broken.set([0x58, 0x58, 0x58, 0x58, 0x58], 0);
    return broken;
  }

  if (corruptionMode === 'scrambled-xref') {
    const broken = new Uint8Array(rawBytes);
    const mid = Math.floor(broken.length * 0.85);
    for (let j = mid; j < Math.min(mid + 80, broken.length); j++) {
      broken[j] = 0x30;
    }
    return broken;
  }

  return rawBytes;
}