import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, LangBadge, ScriptName } from '../shared/ui.jsx';
import { COLORS, langColor } from '../../config/colors.js';

// The three poles of the tradition's geography.
const AXIS = ['Bağdat', 'Nîşâbur', 'Konya'];

export default function MapView() {
  const { data, loading, error } = useAsyncData('data/corpus.json');
  const { t, f, num, lang } = useUI();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [heat, setHeat] = useState(false);
  const [selected, setSelected] = useState(null);

  // aggregate works → cities
  const cities = useMemo(() => {
    if (!data) return [];
    const m = new Map();
    for (const w of data) {
      const key = w.city;
      if (!m.has(key)) {
        m.set(key, {
          city: w.city, lat: w.lat, lng: w.lng,
          city_tr: w.city_tr, city_en: w.city_en, city_ar: w.city_ar, city_fa: w.city_fa,
          words: 0, works: [], langs: {},
        });
      }
      const c = m.get(key);
      c.words += w.words;
      c.works.push(w);
      c.langs[w.lang] = (c.langs[w.lang] || 0) + 1;
    }
    return [...m.values()].sort((a, b) => b.words - a.words);
  }, [data]);

  const maxWords = useMemo(() => Math.max(...cities.map((c) => c.words), 1), [cities]);

  // init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current || !cities.length) return;
    const map = L.map(mapEl.current, {
      center: [35.5, 48],
      zoom: 5,
      scrollWheelZoom: false,
      attributionControl: true,
      zoomControl: true,
    });
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CARTO',
      subdomains: 'abcd',
      maxZoom: 9,
      minZoom: 3,
    }).addTo(map);

    // draw the Baghdad–Nishapur–Konya axis as a faint scribal line
    const axisPts = AXIS.map((name) => {
      const c = cities.find((x) => x.city === name);
      return c ? [c.lat, c.lng] : null;
    }).filter(Boolean);
    if (axisPts.length >= 2) {
      L.polyline(axisPts, {
        color: COLORS.gold, weight: 1.4, opacity: 0.6, dashArray: '2 6',
      }).addTo(map);
    }
    return () => { map.remove(); mapRef.current = null; };
  }, [cities]);

  // (re)draw circles when cities / heat / lang change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cities.length) return;
    if (layerRef.current) { layerRef.current.remove(); }
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    for (const c of cities) {
      const r = 6 + Math.sqrt(c.words / maxWords) * 30;
      const dominant = Object.entries(c.langs).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ara';
      const color = langColor(dominant);

      if (heat) {
        L.circle([c.lat, c.lng], {
          radius: Math.sqrt(c.words) * 90,
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.14,
        }).addTo(group);
      }

      const marker = L.circleMarker([c.lat, c.lng], {
        radius: r,
        color: '#f6f1e4',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.82,
      }).addTo(group);

      const cityName = f(c, 'city');
      marker.bindTooltip(
        `<strong>${cityName}</strong><br>${c.works.length} ${t('common.works')} · ${num(c.words)} ${t('common.words')}`,
        { direction: 'top', className: 'atlas-tip' }
      );
      marker.on('click', () => setSelected(c));
    }
  }, [cities, heat, maxWords, lang]);

  if (loading) return <Skeleton height={520} />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="lens map-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.harita')}</h1>
        <p className="lens-sub">{t('map.title')} — {t('map.axis')}</p>
      </header>

      <div className="map-shell framed">
        <div className="map-toolbar">
          <label className="map-toggle">
            <input type="checkbox" checked={heat} onChange={(e) => setHeat(e.target.checked)} />
            <span>{t('map.heat')}</span>
          </label>
          <div className="map-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: COLORS.sepia }} />{t('pano.langAra')}</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: COLORS.lapis }} />{t('pano.langPer')}</span>
            <span className="legend-note muted">{t('map.legendSize')}</span>
          </div>
        </div>
        <div ref={mapEl} className="map-canvas" role="application" aria-label={t('map.title')} />
      </div>

      {selected && (
        <aside className="map-detail card">
          <button className="detail-close" onClick={() => setSelected(null)} aria-label={t('common.close')}>✕</button>
          <div className="detail-head">
            <h2>{f(selected, 'city')}</h2>
            <ScriptName text={selected.city_ar} lang="ar" />
          </div>
          <p className="detail-stat">
            <span className="num">{num(selected.words)}</span> {t('common.words')} ·{' '}
            <span className="num">{selected.works.length}</span> {t('common.works')}
          </p>
          <ul className="detail-works">
            {selected.works.sort((a, b) => a.death_ah - b.death_ah).map((w) => (
              <li key={w.id}>
                <span className="dw-title">{f(w, 'title')}</span>
                <span className="dw-meta muted">
                  {f(w, 'author')} · <span className="num">{num(w.death_ah)}</span> {t('units.ah')}
                </span>
                <LangBadge lang={w.lang} />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
