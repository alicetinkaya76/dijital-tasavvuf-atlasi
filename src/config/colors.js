/**
 * Palette — drawn from the pigments of Islamic manuscript illumination (tezhip).
 * Parchment grounds, lampblack ink, lapis lazuli, red-earth sepia, gold leaf.
 *
 * The two script colours carry meaning across the whole atlas:
 *   lapis  → Persian (per)   — lapis was the costliest pigment, reserved for the precious
 *   sepia  → Arabic  (ara)   — red-earth, the everyday ink of the scribe
 * Gold is the rarest mark, used only for the sacred/structural accent.
 */

export const COLORS = {
  paper: '#e9e1cd',
  paper2: '#f4eedd',
  card: '#f6f1e4',
  ink: '#23262f',
  muted: '#6d6452',
  line: '#d6c9ac',
  lapis: '#1f3f6e', // Persian
  sepia: '#8a4f2c', // Arabic
  gold: '#a9791c',
};

/** Script → colour. Used for map circles, badges, network nodes. */
export const LANG_COLOR = {
  ara: COLORS.sepia,
  per: COLORS.lapis,
};

export function langColor(lang) {
  return LANG_COLOR[lang] || COLORS.muted;
}

/**
 * Concept families (cat) → a restrained tint within the parchment world.
 * Kept low-chroma so the page never reads as a generic data dashboard.
 */
export const CAT_COLOR = {
  son: '#6e2f3f',     // ends — fenâ, bekâ … deep madder
  bilgi: '#1f3f6e',   // knowing — mârifet, keşf … lapis
  tecrube: '#8a4f2c', // experience — hâl, vecd, aşk … sepia
  ahlak: '#5b6235',   // ethics — zühd, sabır … olive
  amel: '#7a5a1f',    // practice — zikir, semâ … bronze
  kurum: '#4a4a52',   // institution — şeyh, mürid … slate
};

export function catColor(cat) {
  return CAT_COLOR[cat] || COLORS.muted;
}
