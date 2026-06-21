import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useUI } from './ui-context.jsx';
import { BrandMark } from './components/shared/icons.jsx';
import { LanguageBar, Skeleton, Icons } from './components/shared/ui.jsx';
import { preloadData } from './hooks/useAsyncData.jsx';

const Dashboard = lazy(() => import('./components/dashboard/DashboardView.jsx'));
const MapView = lazy(() => import('./components/mapview/MapView.jsx'));
const TimelineView = lazy(() => import('./components/timeline/TimelineView.jsx'));
const ConceptsView = lazy(() => import('./components/concepts/ConceptsView.jsx'));
const SilsileView = lazy(() => import('./components/silsile/SilsileView.jsx'));
const CorpusView = lazy(() => import('./components/corpus/CorpusView.jsx'));
const AIView = lazy(() => import('./components/ai/AIView.jsx'));

const LENSES = [
  { key: 'pano', Comp: Dashboard, num: 'I' },
  { key: 'harita', Comp: MapView, num: 'II', data: 'data/corpus.json' },
  { key: 'zaman', Comp: TimelineView, num: 'III', data: 'data/corpus.json' },
  { key: 'kavram', Comp: ConceptsView, num: 'IV', data: 'data/concepts.json' },
  { key: 'silsile', Comp: SilsileView, num: 'V', data: 'data/silsile.json' },
  { key: 'kulliyat', Comp: CorpusView, num: 'VI', data: 'data/corpus.json' },
  { key: 'rehber', Comp: AIView, num: 'VII' },
];

function readHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  return LENSES.some((l) => l.key === h) ? h : 'pano';
}

export default function App() {
  const { t, dir } = useUI();
  const [active, setActive] = useState(readHash);

  useEffect(() => {
    const onHash = () => setActive(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // light prefetch on idle so lens switches feel instant
  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => LENSES.forEach((l) => l.data && preloadData(l.data)))
      : setTimeout(() => LENSES.forEach((l) => l.data && preloadData(l.data)), 1200);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  const go = useCallback((key) => {
    window.location.hash = `#/${key}`;
    setActive(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const current = LENSES.find((l) => l.key === active) || LENSES[0];
  const Current = current.Comp;

  return (
    <div className="app" dir={dir}>
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" onClick={() => go('pano')} aria-label={t('app.title')}>
            <span className="brand-mark"><BrandMark /></span>
            <span className="brand-text">
              <span className="brand-title">{t('app.title')}</span>
              <span className="brand-thesis">{t('app.thesis')}</span>
            </span>
          </button>
          <LanguageBar />
        </div>
        <nav className="app-nav" aria-label="lenses">
          {LENSES.map((l) => {
            const Ico = Icons[l.key];
            return (
              <button
                key={l.key}
                className={`nav-tab ${active === l.key ? 'active' : ''}`}
                aria-current={active === l.key ? 'page' : undefined}
                onMouseEnter={() => l.data && preloadData(l.data)}
                onClick={() => go(l.key)}
              >
                <span className="nav-num">{l.num}</span>
                {Ico && <Ico className="nav-ico" />}
                {t(`nav.${l.key}`)}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="app-main">
        <Suspense fallback={<Skeleton height={420} />}>
          <Current onNavigate={go} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useUI();
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>{t('footer.source')}</h4>
          <p>{t('footer.sourceBody')}</p>
        </div>
        <div className="footer-col">
          <h4>{t('footer.about')}</h4>
          <p>{t('footer.aboutBody')}</p>
        </div>
        <div className="footer-col">
          <h4>{t('coverage.title')}</h4>
          <p>{t('coverage.note')}</p>
        </div>
        <div className="footer-col">
          <h4>{t('footer.method')}</h4>
          <p>{t('footer.blind')}</p>
        </div>
      </div>
      <div className="footer-bottom">{t('app.thesis')} · {t('app.thesisAr')}</div>
    </footer>
  );
}
