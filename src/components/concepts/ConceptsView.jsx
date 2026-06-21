import { useMemo, useState } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, ZahirBatin, LangBadge, Gloss } from '../shared/ui.jsx';
import { catColor, langColor, COLORS } from '../../config/colors.js';
import ConceptNetwork from './ConceptNetwork.jsx';
import ConceptHeatmap from './ConceptHeatmap.jsx';
import ConceptFlow from './ConceptFlow.jsx';

const FAMILY_ORDER = ['son', 'bilgi', 'tecrube', 'ahlak', 'amel', 'kurum'];

export default function ConceptsView() {
  const conceptsRes = useAsyncData('data/concepts.json');
  const netRes = useAsyncData('data/concept_network.json');
  const corpusRes = useAsyncData('data/corpus.json');
  const { t, f, num, rtl } = useUI();
  const [selected, setSelected] = useState('');
  const [distMode, setDistMode] = useState('raw');
  const [pair, setPair] = useState({ a: '', b: '' });

  const concepts = conceptsRes.data;
  const net = netRes.data;
  const works = corpusRes.data;

  const byFamily = useMemo(() => {
    if (!concepts) return {};
    const g = {};
    for (const c of concepts) (g[c.cat] = g[c.cat] || []).push(c);
    return g;
  }, [concepts]);

  const concept = useMemo(
    () => (concepts ? concepts.find((c) => c.key === selected) : null),
    [concepts, selected]
  );

  // distribution of the selected concept across works (sorted desc)
  const distribution = useMemo(() => {
    if (!works || !selected) return [];
    return works
      .map((w) => ({ w, v: w.concepts?.[selected] || 0 }))
      .filter((d) => d.v > 0)
      .sort((a, b) => b.v - a.v);
  }, [works, selected]);

  const distMax = distribution[0]?.v || 1;

  // corpus mean per concept (basis for distinctiveness)
  const conceptMean = useMemo(() => {
    const m = {};
    if (!works || !concepts) return m;
    for (const c of concepts) {
      m[c.key] = works.reduce((s, w) => s + (w.concepts?.[c.key] || 0), 0) / works.length;
    }
    return m;
  }, [works, concepts]);

  // distinctiveness of the selected concept across ALL works: log2(work / corpus mean)
  const EPS = 0.02;
  const distinctData = useMemo(() => {
    if (!works || !selected) return [];
    const mean = conceptMean[selected] || 0;
    return works
      .map((w) => {
        const v = w.concepts?.[selected] || 0;
        return { w, v, d: Math.log2((v + EPS) / (mean + EPS)) };
      })
      .sort((a, b) => b.d - a.d);
  }, [works, selected, conceptMean]);
  const distinctMaxAbs = useMemo(
    () => Math.max(1, ...distinctData.map((d) => Math.abs(d.d))),
    [distinctData]
  );

  // comparison pair (default: earliest vs latest by death year)
  const sortedByDeath = useMemo(
    () => (works ? [...works].sort((a, b) => a.death_ah - b.death_ah) : []),
    [works]
  );
  const aId = pair.a || sortedByDeath[0]?.id;
  const bId = pair.b || sortedByDeath[sortedByDeath.length - 1]?.id;
  const workA = works?.find((w) => w.id === aId);
  const workB = works?.find((w) => w.id === bId);
  const compareData = useMemo(() => {
    if (!workA || !workB || !concepts) return [];
    return concepts
      .map((c) => ({ c, a: workA.concepts?.[c.key] || 0, b: workB.concepts?.[c.key] || 0 }))
      .filter((d) => d.a > 0 || d.b > 0)
      .sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b))
      .slice(0, 14);
  }, [workA, workB, concepts]);
  const compareMax = useMemo(
    () => Math.max(0.001, ...compareData.map((d) => Math.max(d.a, d.b))),
    [compareData]
  );

  // overview ranking (when nothing selected): concepts by network total
  const ranking = useMemo(() => {
    if (!net) return [];
    return [...net.nodes].sort((a, b) => b.total - a.total);
  }, [net]);
  const rankMax = ranking[0]?.total || 1;

  if (conceptsRes.loading || netRes.loading || corpusRes.loading) return <Skeleton height={560} />;
  const err = conceptsRes.error || netRes.error || corpusRes.error;
  if (err) return <ErrorBox error={err} />;

  return (
    <div className="lens concepts-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.kavram')}</h1>
        <p className="lens-sub">{t('concepts.title')} — {t('lensDesc.kavram')}</p>
      </header>

      <div className="cx-layout">
        {/* concept selector rail */}
        <aside className="cx-rail card">
          <p className="section-eyebrow">{t('concepts.pick')}</p>
          {FAMILY_ORDER.map((fam) =>
            byFamily[fam]?.length ? (
              <div className="cx-family" key={fam}>
                <span className="cx-family-label" style={{ color: catColor(fam) }}>
                  {t(`concepts.families.${fam}`)}
                </span>
                <div className="cx-chips">
                  {byFamily[fam].map((c) => (
                    <button
                      key={c.key}
                      className={`cx-chip ${selected === c.key ? 'active' : ''}`}
                      style={selected === c.key ? { borderColor: catColor(fam), background: catColor(fam), color: '#f6f1e4' } : {}}
                      onClick={() => setSelected(selected === c.key ? '' : c.key)}
                    >
                      {f(c, 'label')}
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </aside>

        {/* main panel */}
        <div className="cx-main">
          {concept ? (
            <section className="cx-detail">
              <div className="cx-detail-head">
                <div>
                  <span className="cx-cat-tag" style={{ background: catColor(concept.cat) }}>
                    {t(`concepts.families.${concept.cat}`)}
                  </span>
                  <h2 className="cx-concept-title">{f(concept, 'label')}</h2>
                  <p className="cx-variants script-ar" lang="ar">
                    {concept.variants?.slice(0, 5).join(' · ')}
                  </p>
                </div>
              </div>

              <ZahirBatin
                counted={
                  <>
                    {distribution.length} {t('common.works')} ·{' '}
                    {t('concepts.distribution').toLowerCase()}
                  </>
                }
                escapes={f(concept, 'zahir')}
              />

              {/* distribution — raw frequency OR distinctiveness */}
              <div className="cx-dist">
                <div className="cx-dist-head">
                  <p className="section-eyebrow" style={{ margin: 0 }}>
                    {t('concepts.distribution')}{' '}
                    <span className="muted">· {distMode === 'raw' ? t('units.perThousand') : 'log₂'}</span>
                  </p>
                  <div className="mode-toggle">
                    <button className={`mode-btn ${distMode === 'raw' ? 'active' : ''}`} onClick={() => setDistMode('raw')}>
                      {t('concepts.modeRaw')}
                    </button>
                    <button className={`mode-btn ${distMode === 'distinct' ? 'active' : ''}`} onClick={() => setDistMode('distinct')}>
                      {t('concepts.modeDistinct')}
                    </button>
                  </div>
                </div>

                {distMode === 'raw' ? (
                  <div className="dist-bars">
                    {distribution.map(({ w, v }) => (
                      <div className="dist-row" key={w.id}>
                        <span className="dist-label" title={f(w, 'title')}>
                          <span className="dist-title">{f(w, 'title')}</span>
                          <span className="dist-author muted">{f(w, 'author')}</span>
                        </span>
                        <span className="dist-track">
                          <span className="dist-fill" style={{ width: `${(v / distMax) * 100}%`, background: langColor(w.lang) }} />
                        </span>
                        <span className="dist-val num">{v.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="diverge-axis">
                      <span className="diverge-cap under">← {t('concepts.under')}</span>
                      <span className="diverge-cap over">{t('concepts.over')} →</span>
                    </div>
                    <div className="diverge-bars">
                      {distinctData.map(({ w, d }) => {
                        const pct = (Math.abs(d) / distinctMaxAbs) * 50;
                        const over = d >= 0;
                        return (
                          <div className="diverge-row" key={w.id}>
                            <span className="diverge-label" title={f(w, 'title')}>
                              <span className="dist-title">{f(w, 'title')}</span>
                              <span className="dist-author muted">{f(w, 'author')}</span>
                            </span>
                            <span className="diverge-track">
                              <span className="diverge-center" />
                              <span
                                className="diverge-fill"
                                style={{
                                  width: `${pct}%`,
                                  [over ? 'insetInlineStart' : 'insetInlineEnd']: '50%',
                                  background: over ? COLORS.madder : COLORS.lapis,
                                }}
                              />
                            </span>
                            <span className="diverge-val num" style={{ color: over ? COLORS.madder : COLORS.lapis }}>
                              {d > 0 ? '+' : ''}{d.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Gloss eyebrow={t('concepts.modeDistinct')} lang={rtl ? 'ar' : 'en'}>
                      {t('concepts.distinctHint')}
                    </Gloss>
                  </>
                )}
              </div>
            </section>
          ) : (
            <section className="cx-overview">
              <p className="section-eyebrow">{t('concepts.distribution')} · {t('common.all')}</p>
              <p className="section-hint">{t('concepts.pick')}.</p>
              <div className="rank-bars">
                {ranking.map((nd) => (
                  <button className="rank-row" key={nd.id} onClick={() => setSelected(nd.id)}>
                    <span className="rank-label">{f(nd, 'label')}</span>
                    <span className="rank-track">
                      <span className="rank-fill" style={{ width: `${(nd.total / rankMax) * 100}%`, background: catColor(nd.cat) }} />
                    </span>
                    <span className="rank-val num">{nd.total.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* co-occurrence network */}
          <section className="cx-section card">
            <p className="section-eyebrow">{t('concepts.network')}</p>
            <ConceptNetwork net={net} selected={selected} onSelect={setSelected} />
          </section>

          {/* heatmap */}
          <section className="cx-section card">
            <p className="section-eyebrow">{t('concepts.heatmap')}</p>
            <ConceptHeatmap concepts={concepts} works={works} selected={selected} onSelect={setSelected} />
          </section>

          {/* cross-generation flow */}
          <section className="cx-section card">
            <p className="section-eyebrow">{t('concepts.sankey')}</p>
            <ConceptFlow concepts={concepts} works={works} />
          </section>

          {/* two-work comparison */}
          <section className="cx-section card cx-compare">
            <p className="section-eyebrow">{t('concepts.compareTitle')}</p>
            <p className="section-hint">{t('concepts.compareHint')}</p>
            <div className="compare-selectors">
              <label className="compare-sel">
                <span className="compare-dot" style={{ background: COLORS.lapis }} />
                <select value={aId} onChange={(e) => setPair((p) => ({ ...p, a: e.target.value }))} className="select">
                  {sortedByDeath.map((w) => (
                    <option key={w.id} value={w.id}>{f(w, 'author')} — {f(w, 'title')}</option>
                  ))}
                </select>
              </label>
              <span className="compare-vs" aria-hidden="true">⇄</span>
              <label className="compare-sel">
                <span className="compare-dot" style={{ background: COLORS.madder }} />
                <select value={bId} onChange={(e) => setPair((p) => ({ ...p, b: e.target.value }))} className="select">
                  {sortedByDeath.map((w) => (
                    <option key={w.id} value={w.id}>{f(w, 'author')} — {f(w, 'title')}</option>
                  ))}
                </select>
              </label>
            </div>

            {workA && workB && aId !== bId ? (
              <div className="tornado">
                <div className="tornado-head">
                  <span style={{ color: COLORS.lapis }}>{f(workA, 'title')}</span>
                  <span className="muted">· {t('units.perThousand')} ·</span>
                  <span style={{ color: COLORS.madder }}>{f(workB, 'title')}</span>
                </div>
                {compareData.map(({ c, a, b }) => (
                  <div className="tornado-row" key={c.key}>
                    <span className="tornado-side left">
                      <span className="tornado-num num">{a.toFixed(1)}</span>
                      <span className="tornado-bar" style={{ width: `${(a / compareMax) * 100}%`, background: COLORS.lapis }} />
                    </span>
                    <span className="tornado-label">{f(c, 'label')}</span>
                    <span className="tornado-side right">
                      <span className="tornado-bar" style={{ width: `${(b / compareMax) * 100}%`, background: COLORS.madder }} />
                      <span className="tornado-num num">{b.toFixed(1)}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-hint muted">{t('concepts.pick')}.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
