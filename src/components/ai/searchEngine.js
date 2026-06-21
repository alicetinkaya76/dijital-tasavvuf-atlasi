/**
 * Client-side full-text search over the corpus chunks.
 * MiniSearch index built in-browser from public/data/chunks.json.
 * Tokenizer folds Turkish + Arabic + Persian so a Latinized query
 * ("marifet", "asik") matches original-script text and vice-versa.
 *
 * Chunk schema: { _id, w, atr, aen, ttr, ten, lang, ah, c, t }
 *   w = work id · a* = author · t* = title · t = body text
 */

import MiniSearch from 'minisearch';
import { tokenize } from '../../utils/normalize.js';

let _engine = null;
let _chunks = null;
let _loadPromise = null;

const OPTIONS = {
  idField: '_id',
  fields: ['t', 'atr', 'aen', 'ttr', 'ten'],
  storeFields: ['w', 'atr', 'aen', 'ttr', 'ten', 'lang', 'ah', 'c', 't'],
  tokenize: (text) => tokenize(text), // already normalizes (TR+AR+FA)
  processTerm: (term) => term || null, // keep normalized form
  searchOptions: {
    boost: { ttr: 4, ten: 4, atr: 3, aen: 3, t: 1 },
    fuzzy: 0.2,
    prefix: true,
  },
};

const BASE = import.meta.env.BASE_URL || '/';

export function loadSearchEngine() {
  if (_engine) return Promise.resolve(_engine);
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const url = BASE.replace(/\/$/, '') + '/data/chunks.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('chunks load failed');
    const chunks = await res.json();

    const engine = new MiniSearch(OPTIONS);
    engine.addAll(chunks);

    _chunks = new Map(chunks.map((c) => [c._id, c]));
    _engine = engine;
    console.log(`[search] indexed ${chunks.length} chunks`);
    return _engine;
  })();

  return _loadPromise;
}

/** Search → deduped top results with snippet text. */
export function search(query, limit = 12) {
  if (!_engine || !query || !query.trim()) return [];
  const raw = _engine.search(query, OPTIONS.searchOptions);
  const out = [];
  const seenPerWork = new Map();
  for (const r of raw) {
    const chunk = _chunks.get(r.id) || r;
    const n = seenPerWork.get(chunk.w) || 0;
    if (n >= 3) continue; // cap chunks per work so results stay diverse
    seenPerWork.set(chunk.w, n + 1);
    out.push({ ...chunk, score: r.score });
    if (out.length >= limit) break;
  }
  return out;
}

/** Count of distinct works that matched a query. */
export function worksMatched(query) {
  if (!_engine || !query.trim()) return 0;
  const raw = _engine.search(query, OPTIONS.searchOptions);
  return new Set(raw.map((r) => (_chunks.get(r.id) || r).w)).size;
}

export function isReady() {
  return _engine !== null;
}
