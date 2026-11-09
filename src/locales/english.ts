import { enCore, type EnglishCore } from './core';
import { content, type Content } from './content';

/**
 * All English text in one object. The website itself loads the two parts separately (see i18n.ts and
 * contentLoader.ts) so visitors do not download every tool's long text on the first page. This combined
 * object is for build-time code, such as the static page generator, and for types.
 */
export type English = EnglishCore & Content;

export const en: English = { ...enCore, ...content };
