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
  | 'trash-2';

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
    isAvailable: true, // Set to true
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
    isAvailable: true, // Set to true
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
    category: 'convert-to-pdf',
    path: '/image-to-pdf',
    icon: 'image',
    isPopularInternet: true,
    isAvailable: true,
    keywords: ['image', 'jpg', 'jpeg', 'png', 'webp', 'convert', 'pdf'],
  },

  // Media
  {
    id: 'image-converter',
    title: 'Image Converter',
    description: 'Convert between PNG, JPG, WebP, and SVG formats.',
    category: 'media',
    path: '/image-converter',
    icon: 'image',
    isPopularInternet: true,
    isAvailable: false,
    keywords: ['image', 'convert', 'webp', 'png', 'jpg'],
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor',
    description: 'Reduce image file size with canvas-based re-encoding.',
    category: 'media',
    path: '/image-compressor',
    icon: 'minimize',
    isAvailable: false,
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
    isAvailable: false,
    keywords: ['json', 'format', 'prettify'],
  },
  {
    id: 'base64-tool',
    title: 'Base64 & Hash',
    description: 'Encode/decode Base64 and compute SHA-256 strings.',
    category: 'dev',
    path: '/base64-tool',
    icon: 'binary',
    isAvailable: false,
    keywords: ['base64', 'sha256', 'hash'],
  },
];