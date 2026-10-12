// Artwork from the official Granblue Fantasy: Relink site (© Cygames), served from public/art.
const BASE = import.meta.env.BASE_URL;

export const art = (path: string) => `${BASE}art/${path}`;

/** Characters with an official portrait (thumbnail) in public/art/chars. */
const PORTRAITS = new Set([
  'PL0000', 'PL0100', 'PL0200', 'PL0300', 'PL0400', 'PL0500', 'PL0600', 'PL0700', 'PL0800', 'PL0900',
  'PL1000', 'PL1100', 'PL1200', 'PL1300', 'PL1400', 'PL1500', 'PL1600', 'PL1700', 'PL1800', 'PL1900',
  'PL2100', 'PL2200', 'PL2300', 'PL2400', 'PL2500', 'PL2600', 'PL2700', 'PL2800', 'PL2900',
]);

export const portrait = (id: string) => (PORTRAITS.has(id) ? art(`chars/${id}.avif`) : null);

/** Vertical name lettering shown over the portrait (Djeeta shares Gran's "Main Character" plate, so none). */
export const namePlate = (id: string) => (PORTRAITS.has(id) && id !== 'PL0100' ? art(`chars/${id}-name.avif`) : null);
