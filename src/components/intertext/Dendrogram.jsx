import { useMemo, useState, useRef, useEffect } from 'react';
import { useUI } from '../../ui-context.jsx';
import { langColor } from '../../config/colors.js';

// Low-chroma cluster palette, toned to the manuscript page.
const CLUSTER_COLORS = ['#1f3f6e', '#8a4f2c', '#6e2f3f', '#5b6e2f', '#5a4a78', '#a9791c'];
const K_OPTIONS = [2, 3, 4, 5, 6];

/* Average-linkage agglomerative clustering of the 22 works.
   distance(i,j) = 1 − similarity(i,j); pairs absent from shared_vocab
   have similarity 0 (distance 1), so a lexically isolated work joins last. */
function buildTree(works, edges) {
  const n = works.length;
  const idx = Object.fromEntries(works.map((w, i) => [w.id, i]));
  const sim = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const e of edges) {
    const a = idx[e.s], b = idx[e.t];
    if (a == null || b == null) continue;
    sim[a][b] = sim[b][a] = e.w;
  }
  const dist = (i, j) => 1 - sim[i][j];

  const byId = {};
  let active = [];
  for (let i = 0; i < n; i++) {
    const node = { id: i, leaves: [i], height: 0, left: null, right: null, leaf: i };
    byId[i] = node;
    active.push(i);
  }
  let next = n;
  const clusterDist = (A, B) => {
    let s = 0, c = 0;
    for (const i of A) for (const j of B) { s += dist(i, j); c++; }
    return s / c;
  };
  while (active.length > 1) {
    let best = Infinity, bi = -1, bj = -1;
    for (let x = 0; x < active.length; x++)
      for (let y = x + 1; y < active.length; y++) {
        const d = clusterDist(byId[active[x]].leaves, byId[active[y]].leaves);
        if (d < best) { best = d; bi = x; bj = y; }
      }
    const A = byId[active[bi]], B = byId[active[bj]];
    const m = { id: next++, leaves: [...A.leaves, ...B.leaves], height: best, left: A, right: B };
    byId[m.id] = m;
    active = active.filter((_, k) => k !== bi && k !== bj);
    active.push(m.id);
  }
  return byId[active[0]];
}

function clustersForK(root, k) {
  let roots = [root];
  while (roots.length < k) {
    let idx = -1, h = -1;
    roots.forEach((r, i) => { if (r.left && r.height > h) { h = r.height; idx = i; } });
    if (idx < 0) break;
    const r = roots[idx];
    roots.splice(idx, 1, r.left, r.right);
  }
  const assign = {};
  roots.forEach((r, ci) => r.leaves.forEach((lf) => { assign[lf] = ci; }));
  return assign;
}

export default function Dendrogram({ works, edges, selected, onSelect }) {
  const { t, f, lang } = useUI();
  const wrapRef = useRef(null);
  const [w, setW] = useState(820);
  const [k, setK] = useState(4);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setW(Math.max(560, e[0].contentRect.width)));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const tree = useMemo(() => (works && edges ? buildTree(works, edges) : null), [works, edges]);
  const assign = useMemo(() => (tree ? clustersForK(tree, k) : {}), [tree, k]);

  const layout = useMemo(() => {
    if (!tree) return null;
    const n = works.length;
    const rowH = 26;
    const padTop = 16;
    const labelW = Math.min(190, Math.max(140, w * 0.24));
    const axisH = 34;
    const right = 18;
    const H = padTop * 2 + (n - 1) * rowH + axisH;
    const maxH = tree.height || 1;
    const xOf = (h) => labelW + (h / maxH) * (w - labelW - right);

    // leaf order via in-order traversal
    const order = [];
    (function walk(nd) { if (nd.left) { walk(nd.left); walk(nd.right); } else order.push(nd); })(tree);
    order.forEach((nd, i) => { nd.y = padTop + i * rowH; });

    // post-order y for internal nodes + collect segments
    const segs = [];
    const leafColor = (nd) => CLUSTER_COLORS[assign[nd.leaf] % CLUSTER_COLORS.length];
    const sameCluster = (nd) => {
      const cs = new Set(nd.leaves.map((lf) => assign[lf]));
      return cs.size === 1 ? CLUSTER_COLORS[[...cs][0] % CLUSTER_COLORS.length] : 'var(--line)';
    };
    (function place(nd) {
      if (!nd.left) return nd.y;
      const ly = place(nd.left), ry = place(nd.right);
      nd.y = (ly + ry) / 2;
      const px = xOf(nd.height);
      const col = sameCluster(nd);
      // vertical connector between children at parent height
      segs.push({ x1: px, y1: ly, x2: px, y2: ry, color: col });
      // horizontals from each child to parent height
      segs.push({ x1: xOf(nd.left.height), y1: ly, x2: px, y2: ly, color: sameCluster(nd.left) });
      segs.push({ x1: xOf(nd.right.height), y1: ry, x2: px, y2: ry, color: sameCluster(nd.right) });
      return nd.y;
    })(tree);

    const ticks = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const d = (maxH / steps) * i;
      ticks.push({ x: xOf(d), label: d.toFixed(2) });
    }

    return { order, segs, labelW, H, axisH, padTop, rowH, leafColor, ticks, xLeaf: xOf(0) };
  }, [tree, assign, w, works]);

  if (!layout) return null;

  return (
    <div className="dendro" ref={wrapRef}>
      <div className="dendro-toolbar">
        <span className="control-label">{t('intertext.clusters')}:</span>
        <div className="mode-toggle">
          {K_OPTIONS.map((opt) => (
            <button key={opt} className={`mode-btn ${k === opt ? 'active' : ''}`} onClick={() => setK(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${layout.H}`} className="dendro-svg" role="img" aria-label={t('intertext.viewTree')}>
        {/* branches */}
        <g strokeWidth="1.5" fill="none" strokeLinecap="round">
          {layout.segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} />
          ))}
        </g>
        {/* leaves: marker + label */}
        <g>
          {layout.order.map((nd) => {
            const wk = works[nd.leaf];
            const on = selected && selected.id === wk.id;
            return (
              <g key={wk.id} className="dendro-leaf" onClick={() => onSelect(wk)} style={{ cursor: 'pointer' }}>
                <line x1={layout.labelW} y1={nd.y} x2={layout.xLeaf} y2={nd.y} stroke={layout.leafColor(nd)} strokeWidth="1.5" />
                <circle cx={layout.labelW} cy={nd.y} r={on ? 5 : 3.5} fill={langColor(wk.lang)} stroke="var(--paper2)" strokeWidth="1.2" />
                <text
                  x={layout.labelW - 8} y={nd.y} dy="0.32em" textAnchor="end"
                  fontSize="11" fontFamily="var(--font-ui)"
                  fontWeight={on ? 700 : 400}
                  fill={on ? 'var(--gold)' : 'var(--ink)'}
                >
                  {f(wk, 'author')}
                  <title>{f(wk, 'title')}</title>
                </text>
              </g>
            );
          })}
        </g>
        {/* distance axis */}
        <g>
          <line x1={layout.labelW} y1={layout.H - layout.axisH + 6} x2={w - 18} y2={layout.H - layout.axisH + 6} stroke="var(--line)" />
          {layout.ticks.map((tk, i) => (
            <g key={i}>
              <line x1={tk.x} y1={layout.H - layout.axisH + 3} x2={tk.x} y2={layout.H - layout.axisH + 9} stroke="var(--line)" />
              <text x={tk.x} y={layout.H - layout.axisH + 22} textAnchor="middle" fontSize="10" fill="var(--muted)" className="num">{tk.label}</text>
            </g>
          ))}
          <text x={(layout.labelW + w - 18) / 2} y={layout.H - 2} textAnchor="middle" fontSize="10" fill="var(--muted-2)">{t('intertext.distance')}</text>
        </g>
      </svg>
    </div>
  );
}
