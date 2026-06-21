import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, ScriptName, LangBadge, Gloss } from '../shared/ui.jsx';
import { COLORS, langColor } from '../../config/colors.js';

const MIN_T = 0.04;
const MAX_T = 0.45;

export default function IntertextView() {
  const corpusRes = useAsyncData('data/corpus.json');
  const svRes = useAsyncData('data/shared_vocab.json');
  const { t, f, num, lang } = useUI();
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const posRef = useRef({}); // preserve node positions across re-sims
  const [size, setSize] = useState({ w: 760, h: 560 });
  const [threshold, setThreshold] = useState(0.1);
  const [selected, setSelected] = useState(null);

  const works = corpusRes.data;
  const edgesAll = svRes.data?.edges;

  // index works by id
  const workById = useMemo(
    () => (works ? Object.fromEntries(works.map((w) => [w.id, w])) : {}),
    [works]
  );

  // weighted degree (intertextual centrality) from the FULL graph
  const centrality = useMemo(() => {
    const c = {};
    if (!edgesAll) return c;
    for (const e of edgesAll) {
      c[e.s] = (c[e.s] || 0) + e.w;
      c[e.t] = (c[e.t] || 0) + e.w;
    }
    return c;
  }, [edgesAll]);
  const maxCentrality = useMemo(
    () => Math.max(...Object.values(centrality), 0.0001),
    [centrality]
  );

  // affinities for the selected work (full graph, sorted)
  const affinities = useMemo(() => {
    if (!edgesAll || !selected) return [];
    return edgesAll
      .filter((e) => e.s === selected.id || e.t === selected.id)
      .map((e) => ({ other: workById[e.s === selected.id ? e.t : e.s], w: e.w, shared: e.shared }))
      .filter((a) => a.other)
      .sort((a, b) => b.w - a.w);
  }, [edgesAll, selected, workById]);

  // responsive sizing
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => {
      const cw = e[0].contentRect.width;
      setSize({ w: cw, h: Math.max(460, Math.min(640, cw * 0.74)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!works || !edgesAll || !svgRef.current) return;
    const { w, h } = size;
    const nodes = works.map((d) => {
      const p = posRef.current[d.id];
      return { ...d, x: p?.x ?? w / 2 + (Math.random() - 0.5) * 80, y: p?.y ?? h / 2 + (Math.random() - 0.5) * 80 };
    });
    const links = edgesAll
      .filter((e) => e.w >= threshold)
      .map((e) => ({ source: e.s, target: e.t, w: e.w }));

    const rOf = (d) => 7 + Math.sqrt((centrality[d.id] || 0) / maxCentrality) * 21;
    const maxW = d3.max(links, (d) => d.w) || MAX_T;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${w} ${h}`);
    const g = svg.append('g');

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', COLORS.gold)
      .attr('stroke-width', (d) => 0.5 + (d.w / maxW) * 4)
      .attr('stroke-opacity', (d) => 0.18 + (d.w / maxW) * 0.45);

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('class', 'it-node').style('cursor', 'pointer').call(drag());

    node.append('circle')
      .attr('r', rOf)
      .attr('fill', (d) => langColor(d.lang))
      .attr('fill-opacity', 0.86)
      .attr('stroke', 'var(--paper2)').attr('stroke-width', 2);

    node.append('text')
      .text((d) => f(d, 'author'))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => rOf(d) + 12)
      .attr('font-size', 10.5).attr('font-family', 'var(--font-ui)')
      .attr('fill', 'var(--ink)').attr('pointer-events', 'none')
      .attr('stroke', 'var(--paper)').attr('stroke-width', 3).attr('paint-order', 'stroke');

    node.on('click', (_e, d) => setSelected(d));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id)
        .distance((d) => 60 + (1 - d.w / maxW) * 110)
        .strength((d) => 0.05 + (d.w / maxW) * 0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide((d) => rOf(d) + 18))
      .on('tick', ticked);

    function ticked() {
      nodes.forEach((d) => {
        d.x = Math.max(rOf(d) + 6, Math.min(w - rOf(d) - 6, d.x));
        d.y = Math.max(rOf(d) + 6, Math.min(h - rOf(d) - 16, d.y));
        posRef.current[d.id] = { x: d.x, y: d.y };
      });
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    }
    function drag() {
      return d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    }
    return () => sim.stop();
  }, [works, edgesAll, size, threshold, centrality, maxCentrality, lang]);

  // highlight selection + its links
  useEffect(() => {
    if (!svgRef.current || !edgesAll) return;
    const svg = d3.select(svgRef.current);
    const nb = new Set();
    if (selected) {
      nb.add(selected.id);
      edgesAll.forEach((e) => {
        if (e.w < threshold) return;
        if (e.s === selected.id) nb.add(e.t);
        if (e.t === selected.id) nb.add(e.s);
      });
    }
    svg.selectAll('.it-node').style('opacity', (d) => (!selected || nb.has(d.id) ? 1 : 0.22));
    svg.selectAll('line').attr('stroke-opacity', (d) => {
      if (!selected) return 0.18 + (d.w / MAX_T) * 0.45;
      return d.source.id === selected.id || d.target.id === selected.id ? 0.85 : 0.05;
    });
  }, [selected, edgesAll, threshold]);

  if (corpusRes.loading || svRes.loading) return <Skeleton height={560} />;
  const err = corpusRes.error || svRes.error;
  if (err) return <ErrorBox error={err} />;

  return (
    <div className="lens intertext-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.intertext')}</h1>
        <p className="lens-sub">{t('intertext.title')}</p>
      </header>

      <Gloss eyebrow={t('nav.intertext')} lang={lang}>{t('intertext.intro')}</Gloss>

      <div className="it-layout">
        <div className="it-graph-wrap framed" ref={wrapRef}>
          <div className="it-toolbar">
            <label className="it-threshold">
              <span className="control-label">{t('intertext.threshold')}</span>
              <input
                type="range" min={MIN_T} max={MAX_T} step={0.05} value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <span className="it-threshold-val num">{threshold.toFixed(2)}</span>
            </label>
            <div className="it-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: COLORS.sepia }} />{t('pano.langAra')}</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: COLORS.lapis }} />{t('pano.langPer')}</span>
              <span className="legend-note muted">{t('intertext.sizeNote')}</span>
            </div>
          </div>
          <svg ref={svgRef} className="it-svg" role="img" aria-label={t('intertext.title')} />
        </div>

        <aside className="it-detail card">
          {selected ? (
            <>
              <button className="detail-close" onClick={() => setSelected(null)} aria-label={t('common.close')}>✕</button>
              <h2 className="it-name">{f(selected, 'title')}</h2>
              <p className="it-name-orig"><ScriptName text={selected.title_ar || selected.title_fa} lang={selected.lang === 'per' ? 'fa' : 'ar'} /></p>
              <p className="it-meta muted">
                {f(selected, 'author')} · {f(selected, 'city')} <LangBadge lang={selected.lang} />
              </p>
              <p className="it-centrality">
                <span className="control-label">{t('intertext.centrality')}:</span>{' '}
                <span className="num">{(centrality[selected.id] || 0).toFixed(2)}</span>
              </p>

              <div className="it-affinities">
                <span className="section-eyebrow">{t('intertext.affinities')}</span>
                {affinities.length ? (
                  <ul>
                    {affinities.map((a, i) => (
                      <li key={i} className="it-aff" onClick={() => setSelected(a.other)}>
                        <span className="it-aff-bar" style={{ width: `${(a.w / MAX_T) * 100}%` }} />
                        <span className="it-aff-body">
                          <span className="it-aff-title">{f(a.other, 'title')}</span>
                          <span className="it-aff-meta muted">
                            {f(a.other, 'author')} · <span className="num">{a.w.toFixed(2)}</span> {t('intertext.similarity')} ·{' '}
                            <span className="num">{num(a.shared)}</span> {t('intertext.sharedTerms')}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted it-isolated">{t('intertext.isolated')}</p>
                )}
              </div>
            </>
          ) : (
            <div className="it-placeholder">
              <p className="section-eyebrow">{t('corpus.colTitle')}</p>
              <p className="muted">{t('intertext.selectHint')}.</p>
              <Gloss eyebrow={t('pano.methodTitle')} lang={lang}>{t('intertext.note')}</Gloss>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
