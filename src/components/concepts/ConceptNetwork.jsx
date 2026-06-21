import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useUI } from '../../ui-context.jsx';
import { catColor } from '../../config/colors.js';

export default function ConceptNetwork({ net, selected, onSelect }) {
  const { f, t } = useUI();
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [size, setSize] = useState({ w: 720, h: 480 });

  // responsive sizing
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0].contentRect.width;
      setSize({ w: cw, h: Math.max(380, Math.min(540, cw * 0.62)) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!net || !svgRef.current) return;
    const { w, h } = size;
    const nodes = net.nodes.map((d) => ({ ...d }));
    const links = net.edges.map((e) => ({ source: e.s, target: e.t, w: e.w }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${w} ${h}`);

    const maxW = d3.max(links, (d) => d.w) || 1;
    const maxTotal = d3.max(nodes, (d) => d.total) || 1;
    const rOf = (d) => 7 + Math.sqrt(d.total / maxTotal) * 20;

    const g = svg.append('g');

    const link = g.append('g')
      .attr('stroke', 'var(--line)')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => 0.6 + (d.w / maxW) * 3)
      .attr('stroke-opacity', 0.45);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cn-node')
      .style('cursor', 'pointer')
      .call(drag());

    node.append('circle')
      .attr('r', rOf)
      .attr('fill', (d) => catColor(d.cat))
      .attr('fill-opacity', 0.85)
      .attr('stroke', 'var(--paper2)')
      .attr('stroke-width', 1.5);

    node.append('text')
      .text((d) => f(d, 'label'))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => rOf(d) + 12)
      .attr('font-size', 11)
      .attr('font-family', 'var(--font-ui)')
      .attr('fill', 'var(--ink)')
      .attr('pointer-events', 'none');

    node.on('click', (_e, d) => onSelect(d.id === selected ? '' : d.id));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((d) => 70 - (d.w / maxW) * 30).strength((d) => 0.1 + (d.w / maxW) * 0.4))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide((d) => rOf(d) + 16))
      .on('tick', ticked);
    simRef.current = sim;

    function ticked() {
      nodes.forEach((d) => {
        d.x = Math.max(rOf(d) + 4, Math.min(w - rOf(d) - 4, d.x));
        d.y = Math.max(rOf(d) + 4, Math.min(h - rOf(d) - 18, d.y));
      });
      link
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    }

    function drag() {
      return d3.drag()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    }

    return () => sim.stop();
  }, [net, size]);

  // highlight selection without rebuilding the sim
  useEffect(() => {
    if (!svgRef.current || !net) return;
    const svg = d3.select(svgRef.current);
    const neighbors = new Set();
    if (selected) {
      neighbors.add(selected);
      net.edges.forEach((e) => {
        if (e.s === selected) neighbors.add(e.t);
        if (e.t === selected) neighbors.add(e.s);
      });
    }
    svg.selectAll('.cn-node')
      .style('opacity', (d) => (!selected || neighbors.has(d.id) ? 1 : 0.25));
    svg.selectAll('line')
      .attr('stroke-opacity', (d) =>
        !selected ? 0.45 : d.source.id === selected || d.target.id === selected ? 0.8 : 0.08)
      .attr('stroke', (d) =>
        selected && (d.source.id === selected || d.target.id === selected) ? 'var(--gold)' : 'var(--line)');
  }, [selected, net]);

  return (
    <div ref={wrapRef} className="cn-wrap">
      <svg ref={svgRef} className="cn-svg" role="img" aria-label={t('concepts.network')} />
      <p className="cn-hint muted">{t('concepts.networkHint')}</p>
    </div>
  );
}
