import { useMemo, useState, useCallback, useRef } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import { useUI } from '../../ui-context.jsx';
import { Skeleton, ErrorBox, LangBadge, ScriptName, Icons, Gloss } from '../shared/ui.jsx';
import { langColor, catColor } from '../../config/colors.js';
import { loadSearchEngine, search as runSearch, worksMatched } from '../ai/searchEngine.js';

export default function CorpusView() {
  const corpusRes = useAsyncData('data/corpus.json');
  const conceptsRes = useAsyncData('data/concepts.json');
  const { t, f, num, lang, rtl } = useUI();
  const [sort, setSort] = useState({ key: 'death_ah', dir: 1 });
  const [expanded, setExpanded] = useState(null);

  // search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [matched, setMatched] = useState(0);
  const debounce = useRef(null);

  const works = corpusRes.data;
  const concepts = conceptsRes.data;
  const catOf = useMemo(
    () => (concepts ? Object.fromEntries(concepts.map((c) => [c.key, c])) : {}),
    [concepts]
  );

  const sorted = useMemo(() => {
    if (!works) return [];
    const arr = [...works];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let av, bv;
      if (key === 'words' || key === 'death_ah') {
        av = a[key]; bv = b[key];
        return (av - bv) * dir;
      }
      if (key === 'lang') { av = a.lang; bv = b.lang; }
      else { av = f(a, key); bv = f(b, key); }
      return String(av).localeCompare(String(bv), 'tr') * dir;
    });
    return arr;
  }, [works, sort, lang]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'words' ? -1 : 1 }));

  const onQuery = useCallback((val) => {
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); setMatched(0); return; }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        await loadSearchEngine();
        setResults(runSearch(val, 14));
        setMatched(worksMatched(val));
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 280);
  }, []);

  if (corpusRes.loading || conceptsRes.loading) return <Skeleton height={520} />;
  const err = corpusRes.error || conceptsRes.error;
  if (err) return <ErrorBox error={err} />;

  const cols = [
    { key: 'author', label: t('corpus.colAuthor') },
    { key: 'title', label: t('corpus.colTitle') },
    { key: 'city', label: t('corpus.colCity') },
    { key: 'death_ah', label: t('corpus.colDeath'), num: true },
    { key: 'words', label: t('corpus.colWords'), num: true },
    { key: 'lang', label: t('corpus.colLang') },
  ];

  const sortArrow = (key) => (sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '');

  return (
    <div className="lens corpus-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.kulliyat')}</h1>
        <p className="lens-sub">{t('corpus.title')}</p>
      </header>

      {/* full-text search */}
      <section className="corpus-search card">
        <p className="section-eyebrow">{t('corpus.fullText')}</p>
        <div className="search-field">
          <Icons.search className="search-ico" />
          <input
            type="search"
            className="search-input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            dir="auto"
          />
          {searching && <span className="spinner" />}
        </div>

        {query.trim() && (
          <div className="search-results">
            <p className="search-meta muted">
              {results.length ? (
                <><span className="num">{num(matched)}</span> {t('corpus.matchesIn')}</>
              ) : !searching ? (
                t('common.noResults')
              ) : null}
            </p>
            <ul className="result-list">
              {results.map((r) => (
                <li className="result-item" key={r._id}>
                  <div className="result-head">
                    <span className="result-title">{lang === 'tr' ? r.ttr : r.ten}</span>
                    <span className="result-author muted">{lang === 'tr' ? r.atr : r.aen}</span>
                    <LangBadge lang={r.lang} />
                  </div>
                  <p
                    className={`result-snippet ${r.lang === 'per' ? 'script-fa' : 'script-ar'}`}
                    lang={r.lang === 'per' ? 'fa' : 'ar'}
                    dir="rtl"
                  >
                    {r.t.slice(0, 260)}…
                  </p>
                </li>
              ))}
            </ul>
            {results.length > 0 && (
              <Gloss eyebrow={t('corpus.reading')} lang={lang}>{t('corpus.readingNote')}</Gloss>
            )}
          </div>
        )}
      </section>

      {/* sortable table */}
      <section className="corpus-table-wrap scroll-x">
        <table className="corpus-table data">
          <thead>
            <tr>
              <th className="ct-expand" aria-hidden="true"></th>
              {cols.map((c) => (
                <th key={c.key} className={c.num ? 'ct-num' : ''}>
                  <button className="ct-sort" onClick={() => toggleSort(c.key)}>
                    {c.label} <span className="ct-arrow">{sortArrow(c.key)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((w) => (
              <ExpandableRow
                key={w.id}
                w={w}
                open={expanded === w.id}
                onToggle={() => setExpanded(expanded === w.id ? null : w.id)}
                catOf={catOf}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ExpandableRow({ w, open, onToggle, catOf }) {
  const { t, f, num } = useUI();
  const topConcepts = useMemo(() => {
    return Object.entries(w.concepts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [w]);
  const max = topConcepts[0]?.[1] || 1;

  return (
    <>
      <tr className={`ct-row ${open ? 'open' : ''}`} onClick={onToggle}>
        <td className="ct-expand">
          <span className={`ct-chevron ${open ? 'open' : ''}`}>›</span>
        </td>
        <td className="ct-author">{f(w, 'author')}</td>
        <td className="ct-title">
          {f(w, 'title')}
          <ScriptName text={w.title_ar || w.title_fa} lang={w.lang === 'per' ? 'fa' : 'ar'} />
        </td>
        <td className="ct-city">{f(w, 'city')}</td>
        <td className="ct-num num">{num(w.death_ah)}</td>
        <td className="ct-num num">{num(w.words)}</td>
        <td><LangBadge lang={w.lang} /></td>
      </tr>
      {open && (
        <tr className="ct-detail-row">
          <td colSpan={7}>
            <div className="ct-detail">
              <div className="ct-profile">
                <span className="section-eyebrow">{t('corpus.profile')} <span className="muted">· {t('units.perThousand')}</span></span>
                <div className="profile-bars">
                  {topConcepts.map(([k, v]) => (
                    <div className="profile-row" key={k}>
                      <span className="profile-label">{catOf[k] ? f(catOf[k], 'label') : k}</span>
                      <span className="profile-track">
                        <span className="profile-fill" style={{ width: `${(v / max) * 100}%`, background: catColor(catOf[k]?.cat) }} />
                      </span>
                      <span className="profile-val num">{v.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ct-sample">
                <span className="section-eyebrow">{t('corpus.reading')}</span>
                <p className={`sample-text ${w.lang === 'per' ? 'script-fa' : 'script-ar'}`} lang={w.lang === 'per' ? 'fa' : 'ar'} dir="rtl">
                  {(w.sample || '').slice(0, 320)}…
                </p>
                <p className="sample-note muted">{t('corpus.readingNote')}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
