import React from 'react';
import { SizePresetLinks } from '../components/common/SizePresetLinks';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageResizer } from '../components/tools/ImageResizer';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageGuide } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

interface ImageResizerPageProps {
  guideId: 'imageResizer' | 'imageResizer20' | 'imageResizer50' | 'imageResizer100' | 'imageResizer200' | 'imageResizer30' | 'passportPhoto' | 'signatureResizer' | 'examPhoto';
  defaultMaxKb: number;
  defaultPreset?: string;
}

/** Pages that are the general resizer or one of its exact-size versions; they link to each other. */
const SIZE_GUIDES = new Set(['imageResizer', 'imageResizer20', 'imageResizer30', 'imageResizer50', 'imageResizer100', 'imageResizer200']);

export const ImageResizerPage: React.FC<ImageResizerPageProps> = ({ guideId, defaultMaxKb, defaultPreset }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(guideId);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ImageResizer key={guideId} defaultMaxKb={defaultMaxKb} defaultPreset={defaultPreset} />
      {SIZE_GUIDES.has(guideId) && <SizePresetLinks />}
    </ToolLayout>
  );
};

export default ImageResizerPage;
