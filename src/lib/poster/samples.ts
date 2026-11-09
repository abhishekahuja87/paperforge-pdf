import { POSTER_SAMPLE_PRODUCTS } from '../../config/posterSamples';
import { loadPhotoFromUrl, type LoadedImage } from './images';

let cache: Promise<(LoadedImage | null)[]> | null = null;

/** Decodes the sample photos once and shares them, so every preview on a page reuses the same pictures. */
export function loadSamplePhotos(): Promise<(LoadedImage | null)[]> {
  if (!cache) cache = Promise.all(POSTER_SAMPLE_PRODUCTS.map((sample) => loadPhotoFromUrl(sample.image).catch(() => null)));
  return cache;
}
