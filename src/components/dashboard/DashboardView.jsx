import { useMemo } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, Gloss, Icons } from '../shared/ui.jsx';
import { COLORS } from '../../config/colors.js';

const LENS_KEYS = ['harita', 'zaman', 'kavram', 'silsile', 'kulliyat', 'intertext', 'rehber'];
const ROMAN = { harita: 'II', zaman: 'III', kavram: 'IV', silsile: 'V', kulliyat: 'VI', intertext: 'VII', rehber: 'VIII' };

export default function DashboardView({ onNavigate }) {
  const { data, loading, error } = useAsyncData('data/stats.json');
  const { t, num, lang } = useUI();

  const centuries = useMemo(() => {
    if (!data) return [];
    const by = data.by_century_ah || {};
    const max = Math.max(...Object.values(by), 1);
    return Object.entries(by)
      .map(([c, n]) => ({ c: +c, n, pct: n / max }))
      .sort((a, b) => a.c - b.c);
  }, [data]);

  if (loading) return <Skeleton height={460} />;
  if (error) return <ErrorBox error={error} />;

  const stats = [
    { v: data.works, label: t('pano.statWorks') },
    { v: data.total_words, label: t('pano.statWords') },
    { v: data.authors, label: t('pano.statAuthors') },
    { v: data.cities, label: t('pano.statCities') },
    { v: data.concepts, label: t('pano.statConcepts') },
    { v: data.chunks, label: t('pano.statChunks') },
  ];

  return (
    <div className="pano">
      {/* HERO — the thesis is the hero, not a number */}
      <section className="pano-hero framed">
        <div className="hero-illum" aria-hidden="true">
          <Rosette />
        </div>
        <div className="hero-body">
          <p className="section-eyebrow">{t('app.title')}</p>
          <h1 className="hero-thesis">{t('app.thesis')}</h1>
          <p className="hero-thesis-ar script-ar" lang="ar">{t('app.thesisAr')}</p>
          <p className="hero-intro">{t('app.intro')}</p>
          <div className="hero-span">
            <span className="num">{num(data.ah_min)}–{num(data.ah_max)} {t('units.ah')}</span>
            <span className="dot-sep">·</span>
            <span className="num">{num(data.ce_min)}–{num(data.ce_max)} {t('units.ce')}</span>
            <span className="dot-sep">·</span>
            <span>{t('pano.langAra')} + {t('pano.langPer')}</span>
          </div>
        </div>
      </section>

      {/* STATS — quiet data, secondary to the thesis */}
      <section className="stat-grid" aria-label="corpus statistics">
        {stats.map((s, i) => (
          <div className="stat-tile" key={i}>
            <span className="stat-value num">{num(s.v)}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="pano-cols">
        {/* century distribution */}
        <section className="card pano-centuries">
          <p className="section-eyebrow">{t('pano.byCentury')}</p>
          <div className="century-bars">
            {centuries.map((c) => (
              <div className="century-bar" key={c.c}>
                <div className="century-track">
                  <div
                    className="century-fill"
                    style={{ height: `${Math.max(c.pct * 100, 8)}%` }}
                    title={`${c.n}`}
                  >
                    <span className="century-n num">{num(c.n)}</span>
                  </div>
                </div>
                <span className="century-label num">{num(c.c)}.</span>
              </div>
            ))}
          </div>
          <p className="century-axis muted">{t('units.century')}</p>
        </section>

        {/* method + limit gloss */}
        <section className="card pano-method">
          <p className="section-eyebrow">{t('pano.methodTitle')}</p>
          <Gloss eyebrow={t('pano.methodTitle')} lang={lang}>
            {t('pano.method')}
          </Gloss>
        </section>
      </div>

      {/* lens entries */}
      <section className="lens-entries">
        <p className="section-eyebrow">{t('pano.explore')}</p>
        <div className="entry-grid">
          {LENS_KEYS.map((k) => {
            const Ico = Icons[k];
            return (
              <button className="entry-card" key={k} onClick={() => onNavigate(k)}>
                <span className="entry-num">{ROMAN[k]}</span>
                <span className="entry-ico">{Ico && <Ico />}</span>
                <span className="entry-text">
                  <span className="entry-title">{t(`nav.${k}`)}</span>
                  <span className="entry-desc">{t(`lensDesc.${k}`)}</span>
                </span>
                <span className="entry-arrow"><Icons.arrow /></span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Rosette() {
  // larger illuminated şemse for the hero corner
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <g fill="none" stroke={COLORS.gold} opacity="0.5">
        <circle cx="100" cy="100" r="92" strokeWidth="1" />
        <circle cx="100" cy="100" r="74" strokeWidth="0.8" />
      </g>
      <g stroke={COLORS.lapis} fill="none" strokeWidth="0.8" opacity="0.45">
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI) / 8;
          return <line key={i} x1="100" y1="100" x2={100 + 74 * Math.cos(a)} y2={100 + 74 * Math.sin(a)} />;
        })}
      </g>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <circle key={i} cx={100 + 55 * Math.cos(a)} cy={100 + 55 * Math.sin(a)} r="6"
            fill="none" stroke={COLORS.sepia} strokeWidth="0.8" opacity="0.5" />
        );
      })}
      <circle cx="100" cy="100" r="22" fill={COLORS.gold} opacity="0.18" />
      <circle cx="100" cy="100" r="9" fill={COLORS.gold} opacity="0.7" />
    </svg>
  );
}
