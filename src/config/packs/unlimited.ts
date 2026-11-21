import unlimited from '../../locales/packs/unlimited.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/**
 * Tools that paid PDF and design services usually charge for or cap: fillable forms, smart split, bulk photo processing, Bates numbering,
 * multi-size images and GIFs (components/tools/unlimited). All run in the browser, with no limit set by this site on files, pages or uses.
 */
export const UNLIMITED_TOOLS: PackTool[] = [
  definePackTool({
    id: 'make-pdf-fillable', kind: 'makeFillable', guideKey: 'makePdfFillableGuide', category: 'pdf', icon: 'file-plus', tier: 'popular',
    keywords: ['make pdf fillable', 'create fillable pdf free', 'add form fields to pdf', 'convert pdf to fillable form', 'fillable pdf creator online', 'add text box to pdf form', 'add checkbox to pdf', 'make a form fillable free', 'pdf form creator no sign up', 'create pdf form online', 'make scanned form fillable', 'fillable pdf no limit'],
  }, unlimited.toolCatalog),
  definePackTool({
    id: 'smart-split-pdf', kind: 'smartSplit', guideKey: 'smartSplitPdfGuide', category: 'pdf', icon: 'scissors', tier: 'popular',
    keywords: ['split pdf at blank pages', 'split pdf by bookmarks', 'split pdf by file size', 'split pdf every n pages', 'split scanned batch pdf', 'split pdf into equal parts', 'split large pdf under 5mb', 'split pdf by chapters', 'smart split pdf free', 'split pdf into multiple files zip', 'separate scanned documents pdf', 'split pdf no limit'],
  }, unlimited.toolCatalog),
  definePackTool({
    id: 'bulk-image-tools', kind: 'bulkImages', guideKey: 'bulkImageToolsGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['bulk image resizer', 'batch image resize online', 'resize multiple images at once', 'bulk image converter', 'batch convert jpg to png', 'watermark multiple photos', 'bulk image compressor zip', 'resize many photos free', 'convert images to webp in bulk', 'batch photo watermark', 'bulk photo resizer no limit', 'resize photos download zip'],
  }, unlimited.toolCatalog),
  definePackTool({
    id: 'pdf-bates-numbering', kind: 'batesNumber', guideKey: 'batesNumberPdfGuide', category: 'pdf', icon: 'hash', tier: 'popular',
    keywords: ['bates numbering pdf', 'bates stamp pdf free', 'add bates numbers to pdf', 'number pages across multiple pdfs', 'add header and footer to pdf', 'stamp page numbers on pdf', 'pdf page stamp online', 'add file name to pdf footer', 'add date to every pdf page', 'bates numbering free online', 'continuous page numbering multiple pdf', 'bates number no limit'],
  }, unlimited.toolCatalog),
  definePackTool({
    id: 'social-image-resizer', kind: 'socialSizes', guideKey: 'socialImageSizesGuide', category: 'media', icon: 'crop', tier: 'popular',
    keywords: ['resize image for instagram', 'resize image for all social media', 'one image to multiple sizes', 'instagram post and story size converter', 'youtube thumbnail resizer', 'whatsapp status image size', 'resize photo for facebook cover', 'linkedin banner resizer', 'magic resize free', 'social media image resizer free', 'resize image to many sizes zip', 'profile picture size maker'],
  }, unlimited.toolCatalog),
  definePackTool({
    id: 'gif-maker', kind: 'gifMaker', guideKey: 'gifMakerGuide', category: 'media', icon: 'layers', tier: 'popular',
    keywords: ['gif maker', 'photos to gif', 'make gif from images', 'create animated gif online free', 'image to gif converter', 'slideshow gif maker', 'gif maker no watermark', 'picture to animated gif', 'make a gif from pictures', 'gif maker without sign up', 'jpg to gif animation', 'gif creator no limit'],
  }, unlimited.toolCatalog),
];
