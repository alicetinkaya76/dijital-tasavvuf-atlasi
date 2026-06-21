import { useMemo, useState } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, ZahirBatin, LangBadge } from '../shared/ui.jsx';
import { catColor, langColor } from '../../config/colors.js';
import ConceptNetwork from './ConceptNetwork.jsx';
import ConceptHeatmap from './ConceptHeatmap.jsx';
import ConceptFlow from './ConceptFlow.jsx';

const FAMILY_ORDER = ['son', 'bilgi', 'tecrube', 'ahlak', 'amel', 'kurum'];

export default function ConceptsView() {
  const conceptsRes = useAsyncData('data/concepts.json');
  const netRes = useAsyncData('data/concept_network.json');
  const corpusRes = useAsyncData('data/corpus.json');
  const { t, f, num } = useUI();
  const [selected, setSelected] = useState('');

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

              {/* distribution bars */}
              <div className="cx-dist">
                <p className="section-eyebrow" style={{ marginTop: 'var(--sp-4)' }}>
                  {t('concepts.distribution')} <span className="muted">· {t('units.perThousand')}</span>
                </p>
                <div className="dist-bars">
                  {distribution.map(({ w, v }) => (
                    <div className="dist-row" key={w.id}>
                      <span className="dist-label" title={f(w, 'title')}>
                        <span className="dist-title">{f(w, 'title')}</span>
                        <span className="dist-author muted">{f(w, 'author')}</span>
                      </span>
                      <span className="dist-track">
                        <span
                          className="dist-fill"
                          style={{ width: `${(v / distMax) * 100}%`, background: langColor(w.lang) }}
                        />
                      </span>
                      <span className="dist-val num">{v.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
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
        </div>
      </div>
    </div>
  );
}
