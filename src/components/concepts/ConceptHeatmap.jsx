import { useMemo } from 'react';
import { useUI } from '../../ui-context.jsx';

/* Average per-1000-word frequency of each concept within each century.
   Honest aggregate: cell = mean of the concept's frequency across the
   works of that century. Colour uses a sqrt scale so rarer concepts
   remain visible beside the dominant ones. */
export default function ConceptHeatmap({ concepts, works, selected, onSelect }) {
  const { f, num, rtl } = useUI();

  const { centuries, matrix, max } = useMemo(() => {
    const byC = {};
    for (const w of works) {
      const c = Math.floor((w.death_ah - 1) / 100) + 1;
      (byC[c] = byC[c] || []).push(w);
    }
    const centuries = Object.keys(byC).map(Number).sort((a, b) => a - b);
    let max = 0;
    const matrix = concepts.map((concept) => {
      const row = centuries.map((c) => {
        const ws = byC[c];
        const avg = ws.reduce((s, w) => s + (w.concepts?.[concept.key] || 0), 0) / ws.length;
        max = Math.max(max, avg);
        return avg;
      });
      return { concept, row };
    });
    return { centuries, matrix, max };
  }, [concepts, works]);

  const colorFor = (v) => {
    if (!v) return 'var(--card-2)';
    const tt = Math.sqrt(v / max); // 0..1
    // parchment → lapis ramp
    return `color-mix(in srgb, var(--lapis) ${Math.round(tt * 88)}%, var(--paper2))`;
  };

  return (
    <div className="hm-wrap scroll-x">
      <table className="hm-table data">
        <thead>
          <tr>
            <th className="hm-corner"></th>
            {centuries.map((c) => (
              <th key={c} className="hm-col-head num">{num(c)}.</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map(({ concept, row }) => (
            <tr
              key={concept.key}
              className={selected === concept.key ? 'hm-row-sel' : ''}
              onClick={() => onSelect(selected === concept.key ? '' : concept.key)}
            >
              <th className="hm-row-head">{f(concept, 'label')}</th>
              {row.map((v, i) => (
                <td
                  key={i}
                  className="hm-cell"
                  style={{ background: colorFor(v) }}
                  title={`${f(concept, 'label')} · ${centuries[i]}. — ${v.toFixed(2)}`}
                >
                  <span className="hm-val num" style={{ color: v / max > 0.4 ? 'var(--paper2)' : 'var(--muted)' }}>
                    {v >= 0.05 ? v.toFixed(1) : ''}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
