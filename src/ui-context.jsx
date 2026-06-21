import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { t as translate, f as fieldOf, isRTL, dir } from './data/i18n-utils.js';
import { fmtNum } from './utils/normalize.js';

const UIContext = createContext(null);

const LS_LANG = 'tasavvuf.lang';
const LS_DIGITS = 'tasavvuf.eastern';

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LS_LANG);
    if (saved && ['tr', 'en', 'ar', 'fa'].includes(saved)) return saved;
  } catch {}
  const nav = (navigator.language || 'tr').slice(0, 2);
  if (['tr', 'en', 'ar', 'fa'].includes(nav)) return nav;
  return 'tr';
}

export function UIProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);
  const [eastern, setEasternState] = useState(() => {
    try {
      const v = localStorage.getItem(LS_DIGITS);
      return v == null ? true : v === '1';
    } catch {
      return true;
    }
  });

  const setLang = useCallback((L) => {
    setLangState(L);
    try { localStorage.setItem(LS_LANG, L); } catch {}
  }, []);

  const setEastern = useCallback((v) => {
    setEasternState(v);
    try { localStorage.setItem(LS_DIGITS, v ? '1' : '0'); } catch {}
  }, []);

  // reflect language + direction on <html> for native RTL + font selection
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir(lang));
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => translate(key, lang);
    const fld = (obj, field) => fieldOf(obj, field, lang);
    // number formatting honouring the Eastern-digit toggle
    const num = (n) => fmtNum(n, lang, eastern);
    return {
      lang,
      setLang,
      eastern,
      setEastern,
      rtl: isRTL(lang),
      dir: dir(lang),
      t,
      f: fld,
      num,
    };
  }, [lang, eastern, setLang, setEastern]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
