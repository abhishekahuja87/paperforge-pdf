export const catalogDesigns = [
  { id: 'warm', name: 'Warm Catalog', description: 'Soft neutrals · classic tiles', count: 9 },
  { id: 'featured', name: 'Modern Showcase', description: 'Navy and ivory · bold grid', count: 4 },
  { id: 'sage', name: 'Garden Market', description: 'Sage and cream · airy cards', count: 6 },
  { id: 'plum', name: 'The Feature Edit', description: 'Plum and blush · featured product', count: 6 },
  { id: 'market', name: 'The Market List', description: 'Terracotta and cream · compact offers', count: 12 },
  { id: 'ink', name: 'City Collection', description: 'Charcoal and parchment · editorial grid', count: 12 },
  { id: 'sunset', name: 'Sunset Picks', description: 'Coral and peach · large product cards', count: 4 },
  { id: 'editorial', name: 'Quiet Luxury', description: 'Olive and linen · minimal editorial', count: 9 },
  { id: 'atelier', name: 'Atelier Collection', description: 'Ivory and burgundy · arched photo frames', count: 4 },
  { id: 'bento', name: 'Curated Finds', description: 'Cobalt and lemon · asymmetric feature grid', count: 6 },
  { id: 'sidebar', name: 'The Storefront', description: 'Forest and ivory · side-panel layout', count: 9 },
  { id: 'list', name: 'Everyday Offers', description: 'Deep teal and cream · horizontal product rows', count: 12 },
] as const;

export type CatalogDesign = (typeof catalogDesigns)[number];
