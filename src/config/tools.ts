import en from '../locales/en.json';

export type ToolCategory = 'pdf' | 'media' | 'dev' | 'text' | 'display' | 'business';

export type ToolIconName = 
  | 'layers' 
  | 'scissors' 
  | 'minimize' 
  | 'rotate' 
  | 'image' 
  | 'file-code' 
  | 'binary' 
  | 'type'
  | 'file-plus'
  | 'trash-2'
  | 'hash'
  | 'stamp'
  | 'crop'
  | 'shield-check'
  | 'grid'
  | 'lock'
  | 'unlock'
  | 'file-text'
  | 'presentation'
  | 'git-merge'
  | 'receipt';

export type ToolTier = 'popular' | 'workspace' | 'more' | 'advanced';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: ToolIconName;
  isPopularInternet?: boolean;
  isAvailable: boolean;
  /** Where the tool is surfaced: popular/workspace/more on the homepage, advanced in the footer only. */
  tier: ToolTier;
  keywords: string[];
}

export const CATEGORIES: Record<ToolCategory, { name: string; description: string }> = en.categories;

export const TOOLS: ToolItem[] = [
  {
    id: 'digitize-documents',
    title: 'Digitize Documents',
    description: 'Turn scans and photos into searchable PDFs.',
    category: 'pdf',
    path: '/digitize-documents',
    icon: 'file-text',
    isAvailable: true,
    tier: 'workspace',
    keywords: ['digitize', 'digitise', 'scan', 'ocr', 'searchable', 'image', 'pdf', 'archive'],
  },
  // PDF
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one unified file.',
    category: 'pdf',
    path: '/merge-pdf',
    icon: 'git-merge',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'popular',
    keywords: ['merge', 'combine', 'join', 'pdf'],
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Extract custom page ranges into a separate document.',
    category: 'pdf',
    path: '/split-pdf',
    icon: 'scissors',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'popular',
    keywords: ['split', 'extract', 'pages', 'pdf'],
  },
  {
    id: 'generate-sample-pdf',
    title: 'Sample PDF Generator',
    description: 'Generate test PDFs with custom pages, sizes, and templates.',
    category: 'pdf',
    path: '/generate-sample-pdf',
    icon: 'file-plus',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'advanced',
    keywords: ['sample', 'dummy', 'test', 'generate', 'pdf'],
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Fix portrait or landscape orientation per page.',
    category: 'pdf',
    path: '/rotate-pdf',
    icon: 'rotate',
    isAvailable: true,
    tier: 'more',
    keywords: ['rotate', 'turn', 'orientation', 'pdf'],
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce file size while preserving quality.',
    category: 'pdf',
    path: '/compress-pdf',
    icon: 'minimize',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'popular',
    keywords: ['compress', 'shrink', 'reduce', 'size', 'pdf', 'optimize'],
  },
  {
    id: 'delete-pdf-pages',
    title: 'Delete PDF Pages',
    description: 'Remove unwanted, blank, or sensitive pages.',
    category: 'pdf',
    path: '/delete-pdf-pages',
    icon: 'trash-2',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['delete', 'remove', 'pages', 'prune', 'pdf'],
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, and WebP images into a PDF.',
    category: 'pdf',
    path: '/image-to-pdf',
    icon: 'image',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'popular',
    keywords: ['image', 'jpg', 'jpeg', 'png', 'webp', 'convert', 'pdf'],
  },
  {
    id: 'add-page-numbers',
    title: 'Page Numbers',
    description: 'Stamp page numbers, headers, and footers.',
    category: 'pdf',
    path: '/add-page-numbers',
    icon: 'hash',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['page', 'number', 'numbers', 'header', 'footer', 'pdf', 'pagination'],
  },
  {
    id: 'watermark-pdf',
    title: 'Watermark PDF',
    description: 'Stamp custom text or confidential marks.',
    category: 'pdf',
    path: '/watermark-pdf',
    icon: 'stamp',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['watermark', 'stamp', 'confidential', 'draft', 'overlay', 'pdf'],
  },
  {
    id: 'crop-pdf',
    title: 'Crop PDF',
    description: 'Trim page margins and adjust visible borders.',
    category: 'pdf',
    path: '/crop-pdf',
    icon: 'crop',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['crop', 'trim', 'margins', 'cut', 'borders', 'pdf'],
  },
  {
    id: 'sanitize-pdf',
    title: 'Sanitize PDF',
    description: 'Purge hidden author info, revision history, and metadata.',
    category: 'pdf',
    path: '/sanitize-pdf',
    icon: 'shield-check',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'advanced',
    keywords: ['sanitize', 'metadata', 'privacy', 'strip', 'clean', 'author', 'history', 'pdf'],
  },
  {
    id: 'n-up-pdf',
    title: 'N-Up (Pages Per Sheet)',
    description: 'Combine 2 or 4 pages per sheet for handouts and print savings.',
    category: 'pdf',
    path: '/n-up-pdf',
    icon: 'grid',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'advanced',
    keywords: ['nup', 'handout', 'slides', 'print', 'sheets', 'pages', 'grid', 'pdf'],
  },
  {
    id: 'inspect-pdf',
    title: 'Inspect PDF',
    description: 'Analyze PDF structures, versions, metadata, and security flags.',
    category: 'pdf',
    path: '/inspect-pdf',
    icon: 'binary',
    isPopularInternet: false,
    isAvailable: true,
    tier: 'advanced',
    keywords: ['inspect', 'developer', 'metadata', 'structure', 'debug', 'qa', 'pdf'],
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Encrypt your PDF with passwords and restrict copying.',
    category: 'pdf',
    path: '/protect-pdf',
    icon: 'lock',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['protect', 'encrypt', 'password', 'security', 'lock', 'pdf'],
  },
  {
    id: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Permanently remove password protection and restrictions.',
    category: 'pdf',
    path: '/unlock-pdf',
    icon: 'unlock',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['unlock', 'decrypt', 'password', 'remove', 'security', 'pdf'],
  },
  {
    id: 'flatten-pdf',
    title: 'Flatten PDF',
    description: 'Lock form fields and visual annotations into base page graphics.',
    category: 'pdf',
    path: '/flatten-pdf',
    icon: 'layers',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'advanced',
    keywords: ['flatten', 'forms', 'lock', 'acroform', 'annotations', 'pdf'],
  },
  {
    id: 'pdf-to-images',
    title: 'PDF to Images',
    description: 'Extract and render all pages into sharp PNG images.',
    category: 'pdf',
    path: '/pdf-to-images',
    icon: 'image',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'popular',
    keywords: ['images', 'png', 'jpg', 'render', 'extract', 'pdf to image', 'pdf'],
  },
  {
    id: 'extract-text',
    title: 'Extract Text',
    description: 'Extract textual content page-by-page into plain text.',
    category: 'pdf',
    path: '/extract-text',
    icon: 'file-text',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['text', 'extract', 'read', 'txt', 'copy', 'content', 'pdf'],
  },
  {
    id: 'organize-pdf',
    title: 'Organize PDF',
    description: 'Reorder, rotate, or delete individual pages visually.',
    category: 'pdf',
    path: '/organize-pdf',
    icon: 'layers',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['organize', 'reorder', 'sort', 'arrange', 'delete', 'rotate', 'thumbnails', 'pdf'],
  },
  {
    id: 'master-document-studio',
    title: 'Master Document Studio',
    description: 'Assemble PDF, Word, image, and custom pages into a polished master PDF.',
    category: 'pdf',
    path: '/master-document-studio',
    icon: 'layers',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'workspace',
    keywords: ['document', 'studio', 'assembler', 'combine', 'docx', 'image', 'custom', 'pdf'],
  },

  // Media
  {
    id: 'image-converter',
    title: 'Image Converter',
    description: 'Convert PNG, JPG, and WebP images between common formats.',
    category: 'media',
    path: '/image-converter',
    icon: 'image',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['image', 'convert', 'webp', 'png', 'jpg'],
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor',
    description: 'Reduce image file size with canvas-based re-encoding.',
    category: 'media',
    path: '/image-compressor',
    icon: 'minimize',
    isAvailable: true,
    tier: 'popular',
    keywords: ['compress', 'resize', 'image'],
  },

  {
    id: 'image-resizer',
    title: 'Image Resizer (KB and Pixels)',
    description: 'Reduce an image to a size in KB or exact pixels.',
    category: 'media',
    path: '/image-resizer',
    icon: 'image',
    isAvailable: true,
    tier: 'more',
    keywords: ['resize', 'image', 'kb', 'pixels', 'photo', 'passport', 'signature', 'form'],
  },
  {
    id: 'resize-image-to-20kb',
    title: 'Resize Image to 20 KB',
    description: 'Shrink an image to under 20 KB for form uploads.',
    category: 'media',
    path: '/resize-image-to-20kb',
    icon: 'image',
    isAvailable: true,
    tier: 'advanced',
    keywords: ['resize', 'image', '20kb', '20 kb', 'photo', 'signature', 'form'],
  },
  {
    id: 'resize-image-to-50kb',
    title: 'Resize Image to 50 KB',
    description: 'Shrink an image to under 50 KB for form uploads.',
    category: 'media',
    path: '/resize-image-to-50kb',
    icon: 'image',
    isAvailable: true,
    tier: 'advanced',
    keywords: ['resize', 'image', '50kb', '50 kb', 'photo', 'signature', 'form'],
  },
  {
    id: 'resize-image-to-100kb',
    title: 'Resize Image to 100 KB',
    description: 'Shrink an image to under 100 KB for form uploads.',
    category: 'media',
    path: '/resize-image-to-100kb',
    icon: 'image',
    isAvailable: true,
    tier: 'advanced',
    keywords: ['resize', 'image', '100kb', '100 kb', 'photo', 'signature', 'form'],
  },
  {
    id: 'resize-image-to-200kb',
    title: 'Resize Image to 200 KB',
    description: 'Shrink an image to under 200 KB for form uploads.',
    category: 'media',
    path: '/resize-image-to-200kb',
    icon: 'image',
    isAvailable: true,
    tier: 'advanced',
    keywords: ['resize', 'image', '200kb', '200 kb', 'photo', 'signature', 'form'],
  },

  // Dev
  {
    id: 'json-formatter',
    title: 'JSON Formatter',
    description: 'Prettify, validate, and minify JSON data payloads.',
    category: 'dev',
    path: '/json-formatter',
    icon: 'file-code',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'more',
    keywords: ['json', 'format', 'prettify'],
  },
  {
    id: 'base64-tool',
    title: 'Base64 & Hash',
    description: 'Encode/decode Base64 and compute SHA-256 strings.',
    category: 'dev',
    path: '/base64-tool',
    icon: 'binary',
    isAvailable: true,
    tier: 'advanced',
    keywords: ['base64', 'sha256', 'hash'],
  },
  {
    id: 'display-studio',
    title: 'Display & Presentation',
    description: 'Present PDF pages, Word documents, and images as a timed fullscreen show.',
    category: 'display',
    path: '/display-studio',
    icon: 'presentation',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'workspace',
    keywords: ['display', 'presentation', 'slideshow', 'classroom', 'tv', 'signage', 'advertising', 'clock', 'fullscreen', 'pdf', 'docx', 'image'],
  },
  {
    id: 'pos-invoice-studio',
    title: 'POS & Bill Studio',
    description: 'Manage shop profiles and inventory, then create printable bills with local-only JSON backups.',
    category: 'business',
    path: '/pos-invoice-studio',
    icon: 'receipt',
    isPopularInternet: true,
    isAvailable: true,
    tier: 'workspace',
    keywords: ['pos', 'invoice', 'billing', 'bill', 'receipt', 'inventory', 'product', 'sales', 'tax', 'store', 'business'],
  },
];