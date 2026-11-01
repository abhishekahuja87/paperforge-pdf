export type ToolCategory = 'pdf' | 'media' | 'dev' | 'text';

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
  | 'file-text';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: ToolIconName;
  isPopularInternet?: boolean;
  isAvailable: boolean;
  keywords: string[];
}

export const CATEGORIES: Record<ToolCategory, { name: string; description: string }> = {
  pdf: {
    name: 'PDF Utilities',
    description: 'Manipulate, combine, and organize documents directly on your machine.',
  },
  media: {
    name: 'Image & Media Tools',
    description: 'Compress and transform graphic files without cloud latency.',
  },
  dev: {
    name: 'Developer & Data Tools',
    description: 'Prettify, convert, and inspect data securely without sharing keys.',
  },
  text: {
    name: 'Text & Writing',
    description: 'Character counts, casing transformations, and text utilities.',
  },
};

export const TOOLS: ToolItem[] = [
  // PDF
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one unified file.',
    category: 'pdf',
    path: '/merge-pdf',
    icon: 'layers',
    isPopularInternet: true,
    isAvailable: true,
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
    keywords: ['compress', 'resize', 'image'],
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
    keywords: ['base64', 'sha256', 'hash'],
  },
];