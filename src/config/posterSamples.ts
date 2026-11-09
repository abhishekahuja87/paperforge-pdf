import p1 from '../assets/ac1/14438270.jpg';
import p2 from '../assets/ac1/15569178.jpg';
import p3 from '../assets/ac1/16378442.jpg';
import p4 from '../assets/ac1/24602075.jpg';
import p5 from '../assets/ac1/31251033.jpg';
import p6 from '../assets/ac1/34159010.jpg';

/** Starter products shown the first time the Offer Poster Maker opens, so the designs can be judged straight away. Photos from Pexels. */
export const POSTER_SAMPLE_PRODUCTS: { name: string; original: string; price: string; image: string }[] = [
  { name: 'Body Care Duo', original: '699', price: '499', image: p1 },
  { name: 'Fresh Start Set', original: '599', price: '449', image: p2 },
  { name: 'Cleansing Oil', original: '549', price: '399', image: p3 },
  { name: 'Daily Cleanser', original: '499', price: '349', image: p4 },
  { name: 'Facial Care Set', original: '899', price: '699', image: p5 },
  { name: 'Skin Care Trio', original: '799', price: '599', image: p6 },
];

export const POSTER_SAMPLE_SHOP = { name: 'Your Shop Name', tagline: 'Best prices this week on everyday products', headline: 'BIG SALE', whatsapp: '', facebook: '', instagram: '' };

export const POSTER_MAX_PRODUCTS = 12;
export const POSTER_SHOP_STORAGE_KEY = 'mdu.poster.shop';
