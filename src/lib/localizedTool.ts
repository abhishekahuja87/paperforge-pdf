import i18n from '../i18n';
import type { ToolItem } from '../config/tools';
import en from '../locales/en.json';

type FeaturedId = keyof typeof en.featuredTools;

export function isFeaturedId(id: string): id is FeaturedId {
  return Object.prototype.hasOwnProperty.call(en.featuredTools, id);
}

export function getFeaturedCopy(id: FeaturedId, language: string) {
  const key = `featuredTools.${id}`;
  return {
    title: i18n.t(`${key}.title`, { lng: language }),
    useCase: i18n.t(`${key}.useCase`, { lng: language }),
    description: i18n.t(`${key}.description`, { lng: language }),
    highlights: en.featuredTools[id].highlights.map((_, index) =>
      i18n.t(`${key}.highlights.${index}`, { lng: language })),
  };
}

export function getToolCopy(tool: ToolItem, language: string) {
  if (Object.prototype.hasOwnProperty.call(en.toolCatalog, tool.id)) {
    return {
      title: i18n.t(`toolCatalog.${tool.id}.0`, { lng: language }),
      description: i18n.t(`toolCatalog.${tool.id}.1`, { lng: language }),
      language,
    };
  }
  if (tool.id === 'split-pdf') {
    return {
      title: i18n.t('splitGuide.title', { lng: language }),
      description: i18n.t('splitGuide.subtitle', { lng: language }),
      language,
    };
  }
  if (isFeaturedId(tool.id)) {
    const copy = getFeaturedCopy(tool.id, language);
    return { title: copy.title, description: copy.description, language };
  }
  if (tool.id === 'merge-pdf') {
    return {
      title: i18n.t('title', { ns: 'merge', lng: language }),
      description: i18n.t('subtitle', { ns: 'merge', lng: language }),
      language,
    };
  }
  if (tool.id === 'image-converter' || tool.id === 'image-compressor') {
    const prefix = tool.id === 'image-converter' ? 'converter' : 'compressor';
    return {
      title: i18n.t(`${prefix}Title`, { ns: 'image', lng: language }),
      description: i18n.t(`${prefix}Subtitle`, { ns: 'image', lng: language }),
      language,
    };
  }
  return { title: tool.title, description: tool.description, language: 'en' };
}
