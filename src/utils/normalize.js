/**
 * Text normalization for tolerant search across TR / AR / FA.
 *
 * Mirrors islamicatlas' approach (Turkish + Arabic folding) and extends it
 * with Persian: unify alef/hamza forms, kāf ك→ک, yāʾ ي/ى→ی, tāʾ marbūṭa ة→ه,
 * strip Arabic diacritics (ḥarakāt) and taṭwīl. Turkish casefolding handles
 * İ/ı/ş/ğ/ç/ö/ü so a search for "asik" matches "âşık", "marifet" matches "mârifet".
 */

// Arabic short vowels, tanwīn, shadda, sukūn, superscript alef, taṭwīl
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

// Latin combining diacritics (so âşk → ask, ḥāl → hal)
const LATIN_DIACRITICS = /[\u0300-\u036f]/g;

/** Fold Arabic/Persian letter variants to a single canonical form. */
export function foldArabic(s) {
  return s
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آأإٱ → ا
    .replace(/\u0624/g, '\u0648') // ؤ → و
    .replace(/\u0626/g, '\u064A') // ئ → ي  (then ي → ی below)
    .replace(/\u0629/g, '\u0647') // ة → ه
    .replace(/\u0643/g, '\u06A9') // ك → ک  (Arabic kāf → Persian keheh)
    .replace(/[\u064A\u0649]/g, '\u06CC') // ي ى → ی  (Persian yeh)
    .replace(/[\u200c\u200d]/g, ''); // ZWNJ / ZWJ
}

/** Turkish-aware lowercase + strip Latin diacritics. */
export function foldLatin(s) {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(LATIN_DIACRITICS, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

/** Full normalization: applies both Arabic and Latin folding. */
export function normalize(s) {
  if (!s) return '';
  return foldLatin(foldArabic(String(s))).trim();
}

/** Tokenizer shared by the search index and query path. */
export function tokenize(text) {
  if (!text) return [];
  return normalize(text)
    .split(/[\s\-_/\\()[\]{}<>،؛.,;:!?'"«»“”…\u060C\u061B]+/)
    .filter((t) => t.length > 1);
}

const EASTERN = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Render a number in Eastern Arabic numerals (for AR/FA display). */
export function toEasternDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => EASTERN[+d]);
}

/** Locale-aware number formatting; Eastern digits for ar/fa when requested. */
export function fmtNum(value, lang, easternDigits = true) {
  const grouped = new Intl.NumberFormat(lang === 'fa' ? 'fa' : 'en-US').format(value);
  if ((lang === 'ar' || lang === 'fa') && easternDigits) {
    // Intl 'fa' already yields Persian digits; for 'ar' convert manually.
    return lang === 'ar' ? toEasternDigits(grouped.replace(/,/g, '٬')) : grouped;
  }
  return grouped;
}
