import { useMemo, useState } from 'react';
import { useUI } from '../../ui-context.jsx';
import { catColor } from '../../config/colors.js';

const FAMILIES = ['son', 'bilgi', 'tecrube', 'ahlak', 'amel', 'kurum'];
const VB_W = 900;
const VB_H = 360;
const PAD = 28;
const COL_W = 15;
const MAX_STACK = VB_H - PAD * 2 - 24;

/* Alluvial: how the emphasis of concept families shifts across generations.
   Column = century. Band thickness = summed mean intensity of that family's
   concepts in that century. Ribbons connect the same family between adjacent
   centuries. A legitimate, fully computable cross-generation reading. */
export default function ConceptFlow({ concepts, works }) {
  const { t, num } = useUI();
  const [hover, setHover] = useState(null);

  const { columns, ribbons, scale } = useMemo(() => {
    const catOf = Object.fromEntries(concepts.map((c) => [c.key, c.cat]));
    const byC = {};
    for (const w of works) {
      const c = Math.floor((w.death_ah - 1) / 100) + 1;
      (byC[c] = byC[c] || []).push(w);
    }
    const centuries = Object.keys(byC).map(Number).sort((a, b) => a - b);

    // value[century][family] = sum over family concepts of mean freq
    const val = {};
    let maxTotal = 0;
    for (const c of centuries) {
      const ws = byC[c];
      const fam = Object.fromEntries(FAMILIES.map((fk) => [fk, 0]));
      for (const concept of concepts) {
        const avg = ws.reduce((s, w) => s + (w.concepts?.[concept.key] || 0), 0) / ws.length;
        fam[catOf[concept.key]] = (fam[catOf[concept.key]] || 0) + avg;
      }
      val[c] = fam;
      maxTotal = Math.max(maxTotal, Object.values(fam).reduce((a, b) => a + b, 0));
    }
    const scale = MAX_STACK / (maxTotal || 1);

    const innerW = VB_W - PAD * 2;
    const step = centuries.length > 1 ? innerW / (centuries.length - 1) : 0;

    // build columns with stacked segment geometry
    const columns = centuries.map((c, i) => {
      const x = PAD + step * i;
      let y = PAD + 16;
      const segs = FAMILIES.map((fk) => {
        const hgt = val[c][fk] * scale;
        const seg = { fk, x, y0: y, y1: y + hgt, h: hgt };
        y += hgt;
        return seg;
      });
      return { century: c, x, segs };
    });

    // ribbons between adjacent columns, per family
    const ribbons = [];
    for (let i = 0; i < columns.length - 1; i++) {
      const a = columns[i];
      const b = columns[i + 1];
      FAMILIES.forEach((fk, fi) => {
        const sa = a.segs[fi];
        const sb = b.segs[fi];
        if (sa.h < 0.4 && sb.h < 0.4) return;
        const x1 = sa.x + COL_W;
        const x2 = sb.x;
        const mx = (x1 + x2) / 2;
        const d = [
          `M ${x1} ${sa.y0}`,
          `C ${mx} ${sa.y0}, ${mx} ${sb.y0}, ${x2} ${sb.y0}`,
          `L ${x2} ${sb.y1}`,
          `C ${mx} ${sb.y1}, ${mx} ${sa.y1}, ${x1} ${sa.y1}`,
          'Z',
        ].join(' ');
        ribbons.push({ fk, d });
      });
    }
    return { columns, ribbons, scale };
  }, [concepts, works]);

  const famLabel = (fk) => t(`concepts.families.${fk}`);

  return (
    <div className="flow-wrap">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="flow-svg" role="img" aria-label={t('concepts.sankey')}>
        {/* ribbons */}
        <g>
          {ribbons.map((r, i) => (
            <path
              key={i}
              d={r.d}
              fill={catColor(r.fk)}
              fillOpacity={hover && hover !== r.fk ? 0.08 : 0.32}
              stroke="none"
            />
          ))}
        </g>
        {/* column segments */}
        <g>
          {columns.map((col) =>
            col.segs.map((s) => (
              <rect
                key={col.century + s.fk}
                x={s.x}
                y={s.y0}
                width={COL_W}
                height={Math.max(s.h, 0)}
                fill={catColor(s.fk)}
                fillOpacity={hover && hover !== s.fk ? 0.2 : 0.92}
                rx={1.5}
                onMouseEnter={() => setHover(s.fk)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{`${famLabel(s.fk)} · ${col.century}.`}</title>
              </rect>
            ))
          )}
        </g>
        {/* century labels */}
        <g>
          {columns.map((col) => (
            <text key={col.century} x={col.x + COL_W / 2} y={VB_H - 8} textAnchor="middle"
              fontSize="12" fontFamily="var(--font-ui)" fill="var(--ink)" className="num">
              {num(col.century)}.
            </text>
          ))}
        </g>
      </svg>
      <div className="flow-legend">
        {FAMILIES.map((fk) => (
          <button
            key={fk}
            className={`flow-leg ${hover === fk ? 'active' : ''}`}
            onMouseEnter={() => setHover(fk)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flow-swatch" style={{ background: catColor(fk) }} />
            {famLabel(fk)}
          </button>
        ))}
      </div>
    </div>
  );
}
