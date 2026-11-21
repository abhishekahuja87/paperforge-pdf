/** Common picture sizes people are asked for. They change over time, so the page tells people to check the platform's own guide. */
export interface SizePreset { id: string; label: string; width: number; height: number }

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'square', label: 'Square post', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait post', width: 1080, height: 1350 },
  { id: 'story', label: 'Story, status or reel (vertical)', width: 1080, height: 1920 },
  { id: 'landscape', label: 'Landscape post', width: 1200, height: 628 },
  { id: 'thumbnail', label: 'Video thumbnail', width: 1280, height: 720 },
  { id: 'cover', label: 'Page or profile cover', width: 1640, height: 624 },
  { id: 'banner', label: 'Wide banner', width: 1500, height: 500 },
  { id: 'profile', label: 'Profile picture', width: 400, height: 400 },
  { id: 'a4', label: 'A4 page (150 dpi)', width: 1240, height: 1754 },
];
