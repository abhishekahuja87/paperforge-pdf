import p1 from '../assets/ac1/14438270.jpg';
import p2 from '../assets/ac1/6767794.jpg';
import p3 from '../assets/ac1/16378442.jpg';
import p4 from '../assets/ac1/24602075.jpg';
import p5 from '../assets/ac1/31251033.jpg';
import p6 from '../assets/ac1/34159010.jpg';
import p7 from '../assets/ac1/34939732.jpg';
import p8 from '../assets/ac1/6167442.jpg';
import p9 from '../assets/ac1/15569178.jpg';

const PHOTOS = [p1, p2, p3, p4, p5, p6, p7, p8, p9];

const NAMES: [string, string, string][] = [
  ['Body Care Duo', '699', '499'], ['Fresh Start Set', '599', '449'], ['Cleansing Oil', '549', '399'], ['Daily Cleanser', '499', '349'], ['Facial Care Set', '899', '699'],
  ['Skin Care Trio', '799', '599'], ['Beauty Essentials', '649', '479'], ['The Essential Set', '999', '749'], ['Glow Drops', '399', '299'], ['Everyday Care', '599', '449'],
  ['Beauty Collection', '799', '599'], ['Daily Essentials', '499', '349'], ['Gift Combo', '1299', '899'], ['Travel Kit', '449', '299'], ['Hair Care Set', '749', '549'],
];

/** Starter products shown the first time the Offer Poster Maker opens, so the designs can be judged straight away. The nine photos are from Pexels and are reused for products 10 to 15. */
export const POSTER_SAMPLE_PRODUCTS = NAMES.map(([name, original, price], i) => ({ name, original, price, image: PHOTOS[i % PHOTOS.length] }));

/** Filled in so every part of the poster is visible straight away. Visitors replace these with their own details. */
export const POSTER_SAMPLE_SHOP = { name: 'Your Shop Name', tagline: 'Best prices this week on everyday products', headline: 'BIG SALE', whatsapp: '98765 43210', facebook: 'YourShopPage', instagram: '@yourshop' };

/** Number of products to choose from. Fewer products get bigger photos. */
export const POSTER_COUNTS = [2, 4, 6, 9, 12, 15];
export const POSTER_MAX_PRODUCTS = 15;
export const POSTER_SHOP_STORAGE_KEY = 'mdu.poster.shop.v2';
