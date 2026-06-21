import { useState, useEffect, useRef } from 'react';

/**
 * Lazily fetch JSON from the public/ directory, caching per-URL in a
 * module-level Map so each file is fetched at most once. Ported from the
 * islamicatlas reference. Respects Vite's base path via BASE_URL.
 *
 * @param {string|null} path — like 'data/corpus.json' (no leading slash)
 * @returns {{ data, loading, error }}
 */

const cache = new Map();
const BASE = import.meta.env.BASE_URL || '/';

function resolve(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export default function useAsyncData(path) {
  const url = resolve(path);
  const [data, setData] = useState(() => (url && cache.has(url) ? cache.get(url) : null));
  const [loading, setLoading] = useState(() => Boolean(url && !cache.has(url)));
  const [error, setError] = useState(null);
  const urlRef = useRef(url);

  useEffect(() => {
    if (!url) return;
    urlRef.current = url;

    if (cache.has(url)) {
      setData(cache.get(url));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} · ${url}`);
        return r.json();
      })
      .then((json) => {
        cache.set(url, json);
        if (urlRef.current === url) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (urlRef.current === url) {
          setError(err);
          setLoading(false);
        }
      });
  }, [url]);

  return { data, loading, error };
}

/** Prefetch a JSON file into cache without rendering. */
export function preloadData(path) {
  const url = resolve(path);
  if (!url || cache.has(url)) return;
  fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => json && cache.set(url, json))
    .catch(() => {});
}
