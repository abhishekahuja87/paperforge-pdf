import { POSTER_SAMPLE_PRODUCTS } from '../config/posterSamples';

/** Starting details for the private pamphlet editor. Prices carry a rupee sign here; the owner can edit them freely. */
export const AC1_SHOP = {
  name: 'Ahuja Collection Superstore, Balod',
  tagline: 'Diwali Offers on huge variety of products',
  whatsapp: '78049-91800',
  /** Put in front of the number to build the WhatsApp QR link. */
  countryCode: '91',
  facebook: 'https://www.facebook.com/ahujacollectionbalod/',
  instagram: 'https://www.instagram.com/ahujacollectionbalod/',
};

export const AC1_PRODUCTS = POSTER_SAMPLE_PRODUCTS.map((product) => ({ ...product, original: `₹${product.original}`, price: `₹${product.price}` }));
