import { adsAndAnalyticsConfig } from '../config/adsAndAnalytics';

const STORAGE_PREFIX = 'mdu_clicks_';

export function recordToolClick(toolId: string): void {
  try {
    const key = `${STORAGE_PREFIX}${toolId}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(current + 1));
  } catch {
    // Fail silently if storage is blocked
  }
}

export function getToolClickCount(toolId: string): number {
  try {
    const key = `${STORAGE_PREFIX}${toolId}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  } catch {
    return 0;
  }
}

export interface DynamicBadge {
  text: string;
  variant: 'popular' | 'frequent' | 'favorite';
}

export function getBadgeForTool(toolId: string, isPopularInternet?: boolean): DynamicBadge | null {
  const clicks = getToolClickCount(toolId);
  const { frequentClicks, favoriteClicks } = adsAndAnalyticsConfig.usageThresholds;

  if (clicks >= favoriteClicks) {
    return { text: 'Favorite', variant: 'favorite' };
  }
  if (clicks >= frequentClicks) {
    return { text: 'Frequent', variant: 'frequent' };
  }
  if (isPopularInternet) {
    return { text: 'Popular', variant: 'popular' };
  }
  return null;
}