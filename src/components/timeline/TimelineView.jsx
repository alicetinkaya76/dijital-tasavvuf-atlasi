import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, LangBadge, ScriptName } from '../shared/ui.jsx';
import { langColor, catColor } from '../../config/colors.js';

const SCALE = 2.4; // px per Hijri year
const CARD_GAP = 8;

export default function TimelineView() {
  const { data, loading, error } = useAsyncData('data/corpus.json');
  const conceptsRes = useAsyncData('data/concepts.json');
  const { t, f, num, rtl } = useUI();
  const [langFilter, setLangFilter] = useState('all');
  const [concept, setConcept] = useState('');
  const [active, setActive] = useState(null);
  const measureRef = useRef({});
  const [measureTick, setMeasureTick] = useState(0);

  const works = useMemo(
    () => (data ? [...data].sort((a, b) => a.death_ah - b.death_ah) : []),
    [data]
  );
  const [minAh, maxAh] = useMemo(() => {
    if (!works.length) return [243, 672];
    return [works[0].death_ah, works[works.length - 1].death_ah];
  }, [works]);

  // century band boundaries within range
  const bands = useMemo(() => {
    const out = [];
    const startC = Math.floor(minAh / 100);
    const endC = Math.ceil(maxAh / 100);
    for (let c = startC; c < endC; c++) {
      const from = Math.max(c * 100, minAh);
      const to = Math.min((c + 1) * 100, maxAh);
      out.push({ century: c + 1, from, to, top: (from - minAh) * SCALE, h: (to - from) * SCALE });
    }
    return out;
  }, [minAh, maxAh]);

  const conceptMax = useMemo(() => {
    if (!concept || !works.length) return 1;
    return Math.max(...works.map((w) => w.concepts?.[concept] || 0), 0.001);
  }, [concept, works]);

  // greedy non-overlap placement, anchored near true scaled year
  const placed = useMemo(() => {
    let lastBottom = -Infinity;
    return works.map((w) => {
      const anchor = (w.death_ah - minAh) * SCALE;
      const h = measureRef.current[w.id] || 64;
      const top = Math.max(anchor, lastBottom + CARD_GAP);
      lastBottom = top + h;
      return { w, anchor, top };
    });
  }, [works, minAh, measureTick]);

  const totalH = useMemo(() => {
    const last = placed[placed.length - 1];
    return Math.max((maxAh - minAh) * SCALE + 40, last ? last.top + 90 : 400);
  }, [placed, maxAh, minAh]);

  useLayoutEffect(() => { setMeasureTick((n) => n + 1); /* re-place after first measure */ }, [works.length]);

  if (loading || conceptsRes.loading) return <Skeleton height={520} />;
  if (error) return <ErrorBox error={error} />;

  const concepts = conceptsRes.data || [];
  const dim = (w) => langFilter !== 'all' && w.lang !== langFilter;

  return (
    <div className="lens timeline-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.zaman')}</h1>
        <p className="lens-sub">{t('timeline.title')}</p>
      </header>

      <div className="tl-controls">
        <div className="chip-row">
          <span className="control-label">{t('timeline.filterLang')}:</span>
          {['all', 'ara', 'per'].map((l) => (
            <button key={l} className={`chip ${langFilter === l ? 'active' : ''}`} onClick={() => setLangFilter(l)}>
              {l === 'all' ? t('common.all') : l === 'ara' ? t('pano.langAra') : t('pano.langPer')}
            </button>
          ))}
        </div>
        <label className="tl-concept">
          <span className="control-label">{t('timeline.filterConcept')}:</span>
          <select value={concept} onChange={(e) => setConcept(e.target.value)} className="select">
            <option value="">{t('common.none')}</option>
            {concepts.map((c) => (
              <option key={c.key} value={c.key}>{f(c, 'label')}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="tl-canvas" style={{ height: totalH }}>
        {/* century bands */}
        {bands.map((b) => (
          <div key={b.century} className="tl-band" style={{ top: b.top, height: b.h }}>
            <span className="tl-band-label num">{num(b.century)}. {t('units.century')}</span>
          </div>
        ))}
        {/* spine */}
        <div className="tl-spine" />
        {/* year ticks every 50 */}
        {Array.from({ length: Math.floor((maxAh - minAh) / 50) + 1 }).map((_, i) => {
          const yr = Math.ceil(minAh / 50) * 50 + i * 50;
          if (yr > maxAh) return null;
          return (
            <div key={yr} className="tl-tick" style={{ top: (yr - minAh) * SCALE }}>
              <span className="tl-tick-label num">{num(yr)}</span>
            </div>
          );
        })}

        {/* works */}
        {placed.map(({ w, anchor, top }) => {
          const intensity = concept ? (w.concepts?.[concept] || 0) / conceptMax : 0;
          const cat = concepts.find((c) => c.key === concept)?.cat;
          return (
            <div key={w.id}>
              <span className="tl-node" style={{ top: anchor, background: langColor(w.lang) }} />
              <span className="tl-connector" style={{ top: anchor + 5, height: Math.max(top - anchor, 0) }} />
              <button
                ref={(el) => { if (el) measureRef.current[w.id] = el.offsetHeight; }}
                className={`tl-card ${dim(w) ? 'dim' : ''} ${active === w.id ? 'active' : ''}`}
                style={{ top }}
                onClick={() => setActive(active === w.id ? null : w.id)}
              >
                <span className="tl-year num" style={{ color: langColor(w.lang) }}>
                  {num(w.death_ah)} <small>{t('units.ah')}</small>
                </span>
                <span className="tl-card-body">
                  <span className="tl-title">{f(w, 'title')}</span>
                  <span className="tl-author muted">{f(w, 'author')} · {f(w, 'city')}</span>
                  {active === w.id && (
                    <span className="tl-extra">
                      <ScriptName text={w.title_ar || w.title_fa} lang={w.lang === 'per' ? 'fa' : 'ar'} />
                      <span className="tl-words muted">
                        <span className="num">{num(w.words)}</span> {t('common.words')} · {num(w.death_ce)} {t('units.ce')}
                      </span>
                    </span>
                  )}
                </span>
                {concept ? (
                  <span className="tl-intensity" title={`${(w.concepts?.[concept] || 0).toFixed(2)} ${t('units.perThousand')}`}>
                    <span className="tl-intensity-fill" style={{ width: `${intensity * 100}%`, background: catColor(cat) }} />
                  </span>
                ) : (
                  <LangBadge lang={w.lang} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
