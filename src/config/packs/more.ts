import more from '../../locales/packs/more.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/**
 * Tools that other sites limit, cap or put behind a paid plan: resize and booklet printing, black and white conversion, picture extraction
 * and audio cutting (components/tools/more). All run in the browser, with no limit set by this site on files, pages or uses.
 */
export const MORE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'resize-pdf-page-size', kind: 'resizePdf', guideKey: 'resizePdfPageSizeGuide', category: 'pdf', icon: 'crop', tier: 'popular',
    keywords: ['resize pdf page size', 'change pdf page size to a4', 'convert pdf to a4', 'pdf to letter size', 'change pdf paper size', 'make pdf a5', 'resize pdf pages free', 'pdf page size converter', 'fit pdf to a4', 'change pdf dimensions', 'resize pdf no limit', 'standardize pdf page size'],
  }, more.toolCatalog),
  definePackTool({
    id: 'pdf-booklet-maker', kind: 'bookletMaker', guideKey: 'pdfBookletMakerGuide', category: 'pdf', icon: 'layers', tier: 'popular',
    keywords: ['pdf booklet maker', 'print pdf as booklet', 'make a booklet from pdf', 'booklet printing pdf', 'two pages per sheet booklet', 'saddle stitch pdf', 'fold booklet print', 'pdf to booklet free', 'booklet imposition online', 'a5 booklet from a4', 'booklet order pages', 'booklet maker no limit'],
  }, more.toolCatalog),
  definePackTool({
    id: 'grayscale-pdf', kind: 'grayscalePdf', guideKey: 'grayscalePdfGuide', category: 'pdf', icon: 'file-text', tier: 'popular',
    keywords: ['grayscale pdf', 'convert pdf to black and white', 'pdf to grayscale online', 'make pdf black and white', 'remove color from pdf', 'pdf greyscale converter', 'print pdf without colour', 'save ink pdf', 'black and white pdf free', 'colour pdf to b&w', 'greyscale pdf no limit', 'pdf to monochrome'],
  }, more.toolCatalog),
  definePackTool({
    id: 'extract-images-from-pdf', kind: 'extractPdfImages', guideKey: 'extractImagesFromPdfGuide', category: 'pdf', icon: 'image', tier: 'popular',
    keywords: ['extract images from pdf', 'save pictures from pdf', 'pdf image extractor', 'get photos out of pdf', 'download images from pdf', 'pdf to jpg original quality', 'extract all images pdf zip', 'pull pictures from pdf', 'pdf images free', 'extract logo from pdf', 'extract photos from pdf online', 'pdf image extractor no limit'],
  }, more.toolCatalog),
  definePackTool({
    id: 'audio-cutter-and-joiner', kind: 'audioCutter', guideKey: 'audioCutterAndJoinerGuide', category: 'media', icon: 'git-merge', tier: 'popular',
    keywords: ['audio cutter', 'cut mp3 online', 'trim audio free', 'join audio files', 'merge mp3 online', 'voice note trimmer', 'audio joiner', 'cut audio fade in out', 'trim voice recording', 'audio trimmer no sign up', 'ringtone cutter', 'cut audio no limit'],
  }, more.toolCatalog),
];
