export const adsAndAnalyticsConfig = {
  // Google Analytics 4 Measurement ID (Replace when ready, e.g. 'G-XXXXXXXXXX')
  googleAnalyticsId: 'G-MEASUREMENT_ID',

  // Google AdSense Client ID (e.g. 'ca-pub-XXXXXXXXXXXXXXXX')
  adSenseClientId: 'ca-pub-XXXXXXXXXXXXXXXX',

  // Ad slot toggles and slot IDs
  ads: {
    enabled: true, // Toggle false during local dev if you want clean UI
    homeTopBannerSlot: '1234567890',
    homeBottomBannerSlot: '2345678901',
    toolTopBannerSlot: '3456789012',
    toolBottomBannerSlot: '4567890123',
  },

  // Badge rules based on local device visits
  usageThresholds: {
    frequentClicks: 3, // >= 3 clicks shows "Frequent"
    favoriteClicks: 7, // >= 7 clicks shows "Favorite"
  },
};