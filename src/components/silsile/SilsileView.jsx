import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, ScriptName, Gloss } from '../shared/ui.jsx';
import { COLORS, langColor } from '../../config/colors.js';

const KIND_STYLE = {
  hoca: { color: COLORS.lapis, dash: null, directed: true },
  metin: { color: COLORS.sepia, dash: '5 4', directed: true },
  gelenek: { color: COLORS.gold, dash: '1 5', directed: false },
};

export default function SilsileView() {
  const { data, loading, error } = useAsyncData('data/silsile.json');
  const { t, f, num, lang } = useUI();
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 760, h: 560 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => {
      const cw = e[0].contentRect.width;
      setSize({ w: cw, h: Math.max(460, Math.min(640, cw * 0.72)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const noteOf = (e) => (lang === 'tr' ? e.note_tr : e.note_en) || e.note_en || e.note_tr || '';

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { w, h } = size;
    const nodes = data.nodes.map((d) => ({ ...d }));
    const links = data.edges.map((e) => ({ ...e, source: e.s, target: e.t }));
    const maxDeg = d3.max(nodes, (d) => d.degree) || 1;
    const rOf = (d) => 8 + Math.sqrt((d.degree || 1) / maxDeg) * 16;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${w} ${h}`);

    // arrow markers per kind
    const defs = svg.append('defs');
    Object.entries(KIND_STYLE).forEach(([k, st]) => {
      if (!st.directed) return;
      defs.append('marker')
        .attr('id', `arrow-${k}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', st.color).attr('opacity', 0.7);
    });

    const g = svg.append('g');

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', (d) => KIND_STYLE[d.kind]?.color || COLORS.muted)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.55)
      .attr('stroke-dasharray', (d) => KIND_STYLE[d.kind]?.dash || null)
      .attr('marker-end', (d) => (KIND_STYLE[d.kind]?.directed ? `url(#arrow-${d.kind})` : null));

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .attr('class', 'sl-node').style('cursor', 'pointer').call(drag());

    node.append('circle')
      .attr('r', rOf)
      .attr('fill', (d) => langColor(d.lang))
      .attr('fill-opacity', 0.88)
      .attr('stroke', 'var(--paper2)').attr('stroke-width', 2);

    node.append('text')
      .text((d) => f(d, 'name'))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => rOf(d) + 13)
      .attr('font-size', 11).attr('font-family', 'var(--font-ui)')
      .attr('fill', 'var(--ink)').attr('pointer-events', 'none')
      .attr('stroke', 'var(--paper)').attr('stroke-width', 3).attr('paint-order', 'stroke');

    node.on('click', (_e, d) => setSelected(d));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(95).strength(0.25))
      .force('charge', d3.forceManyBody().strength(-340))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide((d) => rOf(d) + 22))
      .on('tick', ticked);

    function ticked() {
      nodes.forEach((d) => {
        d.x = Math.max(rOf(d) + 6, Math.min(w - rOf(d) - 6, d.x));
        d.y = Math.max(rOf(d) + 6, Math.min(h - rOf(d) - 16, d.y));
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
  }, [data, size, lang]);

  const connections = useMemo(() => {
    if (!data || !selected) return [];
    return data.edges
      .filter((e) => e.s === selected.id || e.t === selected.id)
      .map((e) => {
        const otherId = e.s === selected.id ? e.t : e.s;
        const other = data.nodes.find((n) => n.id === otherId);
        return { e, other, outgoing: e.s === selected.id };
      });
  }, [data, selected]);

  if (loading) return <Skeleton height={560} />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="lens silsile-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.silsile')}</h1>
        <p className="lens-sub">{t('silsile.title')}</p>
      </header>

      <div className="sl-layout">
        <div className="sl-graph-wrap framed" ref={wrapRef}>
          <div className="sl-legend">
            {Object.entries(KIND_STYLE).map(([k, st]) => (
              <span className="legend-item" key={k}>
                <svg width="26" height="8" aria-hidden="true">
                  <line x1="1" y1="4" x2="25" y2="4" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash || ''} />
                </svg>
                {t(`silsile.kinds.${k}`)}
              </span>
            ))}
          </div>
          <svg ref={svgRef} className="sl-svg" role="img" aria-label={t('silsile.title')} />
        </div>

        <aside className="sl-detail card">
          {selected ? (
            <>
              <button className="detail-close" onClick={() => setSelected(null)} aria-label={t('common.close')}>✕</button>
              <h2 className="sl-name">{f(selected, 'name')}</h2>
              <p className="sl-name-orig">
                <ScriptName text={selected.name_ar} lang="ar" />
              </p>
              <p className="sl-meta muted">
                {t('timeline.death')} <span className="num">{num(selected.death_ah)}</span> {t('units.ah')} /{' '}
                <span className="num">{num(selected.death_ce)}</span> {t('units.ce')} · {f(selected, 'city')}
              </p>

              {selected.works?.length > 0 && (
                <div className="sl-works">
                  <span className="section-eyebrow">{t('silsile.worksBy')}</span>
                  <ul>
                    {selected.works.map((wk, i) => (
                      <li key={i}>{lang === 'tr' ? wk.title_tr : wk.title_en}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="sl-connections">
                <span className="section-eyebrow">{t('silsile.connections')}</span>
                <ul>
                  {connections.map(({ e, other, outgoing }, i) => (
                    <li key={i} className="sl-conn">
                      <span className="sl-conn-head">
                        <span className="sl-conn-arrow" style={{ color: KIND_STYLE[e.kind]?.color }}>
                          {outgoing ? '→' : '←'}
                        </span>
                        <span className="sl-conn-name">{other ? f(other, 'name') : ''}</span>
                        <span className="sl-conn-kind" style={{ color: KIND_STYLE[e.kind]?.color }}>
                          {t(`silsile.kinds.${e.kind}`)}
                        </span>
                      </span>
                      <span className="sl-conn-note">{noteOf(e)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="sl-placeholder">
              <p className="section-eyebrow">{t('silsile.node')}</p>
              <p className="muted">{t('common.select')}.</p>
              <Gloss eyebrow={t('silsile.legend')} lang={lang}>
                {t('silsile.curated')}
              </Gloss>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
