import type { Category } from './types';

/**
 * Generated artwork in public/art/. Each entry is optional: components fall back
 * to the hand-drawn SVG scenes (CategoryArt) or gradients when a file isn't listed.
 */
export const ART = {
  hero: '/art/hero-city.webp',
  business: '/art/business.webp',
};

/** Illustrated scenes for each kind of place. Add a category here once its file exists. */
export const PLACE_ART: Partial<Record<Category, string>> = {};
