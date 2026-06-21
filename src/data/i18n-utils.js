/**
 * Dil yardımcıları — language helpers used across every component.
 * Four first-class languages: tr / en / ar / fa.
 *
 *   t(key, lang)         → UI string from the i18n dictionary (dotted keys ok)
 *   f(obj, field, lang)  → suffixed data field: obj.field_tr / _en / _ar / _fa
 *   isRTL(lang)          → ar | fa
 *   dir(lang)            → 'rtl' | 'ltr'
 */

import { T } from './i18n.js';

const FALLBACK = ['en', 'tr'];

/** UI string lookup with dotted keys and fallback chain. */
export function t(key, lang) {
  const langs = [lang, ...FALLBACK];
  for (const L of langs) {
    const dict = T[L];
    if (!dict) continue;
    const val = key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);
    if (val != null) return val;
  }
  return key; // surface the missing key rather than failing silently
}

/** Suffixed data field with fallback (field_tr / field_en / field_ar / field_fa). */
export function f(obj, field, lang) {
  if (!obj) return '';
  return (
    obj[`${field}_${lang}`] ||
    obj[`${field}_en`] ||
    obj[`${field}_tr`] ||
    obj[`${field}_ar`] ||
    ''
  );
}

export function isRTL(lang) {
  return lang === 'ar' || lang === 'fa';
}

export function dir(lang) {
  return isRTL(lang) ? 'rtl' : 'ltr';
}

/** The font family appropriate to a script, for inline original-script text. */
export function scriptFont(lang) {
  if (lang === 'ar') return "'Amiri', serif";
  if (lang === 'fa') return "'Vazirmatn', sans-serif";
  return "var(--font-ui)";
}

export const LANGS = [
  { code: 'tr', label: 'Türkçe', native: 'Türkçe' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'fa', label: 'Persian', native: 'فارسی' },
];
