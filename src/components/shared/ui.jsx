import { useUI } from '../../ui-context.jsx';
import { LANGS, scriptFont } from '../../data/i18n-utils.js';
import { langColor } from '../../config/colors.js';
import { Icons } from './icons.jsx';

/* ── Skeleton loader ──────────────────────────────────────────────── */
export function Skeleton({ height = 280, label }) {
  const { t } = useUI();
  return (
    <div role="status" aria-live="polite">
      <div className="skeleton skeleton-block" style={{ minHeight: height }} />
      <p className="loading-line" style={{ marginTop: '0.75rem' }}>
        <span className="spinner" /> {label || t('common.loading')}
      </p>
    </div>
  );
}

export function ErrorBox({ error }) {
  const { t } = useUI();
  return (
    <div className="error-box card" role="alert">
      <p>{t('common.error')}</p>
      {error?.message && <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{String(error.message)}</p>}
    </div>
  );
}

/* ── The signature gloss (hâşiye) ─────────────────────────────────────
   eyebrow = small uppercase label; children = the bâtın caution. */
export function Gloss({ eyebrow, children, lang }) {
  const { t } = useUI();
  return (
    <p className="gloss" data-eyebrow={eyebrow || t('concepts.zahirNote')} lang={lang}>
      {children}
    </p>
  );
}

/* explicit zâhir↔bâtın split for concept detail */
export function ZahirBatin({ counted, escapes }) {
  const { t } = useUI();
  return (
    <div className="zb-split framed" style={{ padding: '0.85rem 1rem' }}>
      <div className="zb-row">
        <span className="zb-label zahir">{t('concepts.counted')}</span>
        <span className="zb-text" style={{ color: 'var(--ink-soft)', fontStyle: 'normal' }}>{counted}</span>
      </div>
      <hr className="rule-gold" style={{ margin: '0.5rem 0' }} />
      <div className="zb-row">
        <span className="zb-label batin">{t('concepts.escapes')}</span>
        <span className="zb-text">{escapes}</span>
      </div>
    </div>
  );
}

/* ── Language badge (script colour) ───────────────────────────────── */
export function LangBadge({ lang: code }) {
  const { t } = useUI();
  const label = code === 'ara' ? t('pano.langAra') : t('pano.langPer');
  return (
    <span className={`badge lang-${code}`}>
      <span className="dot" style={{ background: langColor(code) }} />
      {label}
    </span>
  );
}

/* ── Original-script name (renders in its native font) ────────────── */
export function ScriptName({ text, lang }) {
  if (!text) return null;
  return <span style={{ fontFamily: scriptFont(lang) }} lang={lang}>{text}</span>;
}

/* ── Header language switcher + digit toggle ──────────────────────── */
export function LanguageBar() {
  const { lang, setLang, eastern, setEastern, t } = useUI();
  return (
    <div className="lang-bar">
      <div className="lang-group" role="group" aria-label={t('common.language')}>
        {LANGS.map((L) => (
          <button
            key={L.code}
            lang={L.code}
            className={`lang-btn ${lang === L.code ? 'active' : ''}`}
            aria-pressed={lang === L.code}
            onClick={() => setLang(L.code)}
            title={L.label}
          >
            {L.native}
          </button>
        ))}
      </div>
      <button
        className={`digit-toggle ${eastern ? 'active' : ''}`}
        aria-pressed={eastern}
        onClick={() => setEastern(!eastern)}
        title={t('common.easternDigits')}
      >
        ٠١٢
      </button>
    </div>
  );
}

export { Icons };
