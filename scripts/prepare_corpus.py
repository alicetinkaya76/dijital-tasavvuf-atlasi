#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
prepare_corpus.py — OpenITI mARkdown → atlas JSON
=================================================
Sibling of islamicatlas.org's scripts/prepare_dia_chunks.py, retargeted at
the 22-work early-Sufi corpus.

Pipeline
--------
For every work directory ``[deathAH][Author].[Work]`` under --input:
  1. pick the primary version file (``*-ara1`` / ``*-per1``), strip the
     ``#META#`` header and OpenITI markup, normalise the script;
  2. read the author identity from the ``#META#`` block where present and
     merge it with the curated bibliographic table (works_meta.py);
  3. compute  ── word count
              ── per-1000-word frequency for each of the 25 concepts
                 (concept_lexicon.py), matched on normalised Arabic/Persian stems
              ── ~280-word overlapping search chunks (for MiniSearch + RAG);
  4. across the corpus, derive
              ── concept co-occurrence edges (shared salient concepts)
              ── work-to-work shared-vocabulary edges (content-word overlap).

Outputs (to --outdir, default public/data/)
  corpus.json            22 works, metadata + concept vector + KWIC samples
  concepts.json          25 concepts, labels + variants + zāhir/bāṭin notes
  chunks.json            search chunks (MiniSearch index source)
  concept_network.json   concept co-occurrence graph
  shared_vocab.json      work↔work shared-vocabulary graph
  stats.json             corpus-level rollups for the dashboard

Usage
  python scripts/prepare_corpus.py --input ../openiti_raw/openiti \
         --outdir public/data
"""
import os, re, json, argparse, sys, math
from pathlib import Path
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from works_meta import WORKS, CITIES, ah_to_ce
from concept_lexicon import CONCEPTS

# ── Arabic / Persian normalisation ───────────────────────────────────────
AR_DIACRITICS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u08d4-\u08ff]")
TATWEEL = "\u0640"

def normalize_ar(s):
    """Fold orthographic variants so Arabic & Persian forms compare equal."""
    if not s:
        return ""
    s = AR_DIACRITICS.sub("", s)
    s = s.replace(TATWEEL, "")
    # unify alef / hamza seats
    s = re.sub("[إأآٱ]", "ا", s)
    # persian/arabic kaf, yeh, heh
    s = s.replace("ك", "ک").replace("ي", "ی").replace("ى", "ی")
    s = s.replace("ة", "ه")
    # persian variants of letters that share Arabic shapes
    s = s.replace("ۀ", "ه").replace("ئ", "ی")
    return s

# proclitics that can attach to a content word (conjunction/article/prepositions)
_PROCLITIC = re.compile(r"^(وال|فال|بال|کال|لل|ال|و|ف|ب|ک|ل)")

def strip_proclitics(tok):
    prev = None
    while tok != prev and len(tok) > 2:
        prev = tok
        tok = _PROCLITIC.sub("", tok, count=1)
    return tok

# Build normalised variant sets once.
NORM_VARIANTS = []
for c in CONCEPTS:
    forms = set()
    for v in c["variants"]:
        forms.add(normalize_ar(v))
    NORM_VARIANTS.append((c["key"], forms))

# Pre-split variants into exact + stem buckets for speed.
def concept_hits(tokens_norm):
    """Return {concept_key: count} over a list of normalised tokens."""
    counts = Counter()
    # index variants by first 2 chars for a cheap prefilter
    for tok in tokens_norm:
        base = strip_proclitics(tok)
        matched = False
        for key, forms in NORM_VARIANTS:
            for f in forms:
                # Count a token when it equals a variant (after proclitic
                # stripping), or carries the variant as a *prefix stem* with at
                # most a short inflectional tail (plural/pronoun ≤2 chars).
                # Deliberately conservative: no loose substring matching, which
                # over-counts short roots.
                if tok == f or base == f or (
                    len(f) >= 4 and base.startswith(f) and len(base) - len(f) <= 2
                ):
                    counts[key] += 1
                    matched = True
                    break
            if matched:
                break
    return counts

# ── OpenITI markup cleaning ──────────────────────────────────────────────
META_END = "#META#Header#End#"
PAGE_RE = re.compile(r"PageV\d+P\d+")
MS_RE = re.compile(r"\bms\d+\b")
EDITORIAL_RE = re.compile(r"@[A-Z]+@|ms\d+|PageV\d+P\d+")

def read_meta_block(raw):
    meta = {}
    head = raw.split(META_END, 1)[0]
    for line in head.splitlines():
        m = re.match(r"#META#\s*([0-9.]*\s*[A-Za-z.]+)\s*::\s*(.+)", line)
        if m:
            key = m.group(1).strip().split(".")[-1]
            val = m.group(2).strip()
            if val and val != "NODATA":
                meta.setdefault(key, val)
    return meta

def clean_body(raw):
    body = raw.split(META_END, 1)[1] if META_END in raw else raw
    body = PAGE_RE.sub(" ", body)
    body = MS_RE.sub(" ", body)
    body = EDITORIAL_RE.sub(" ", body)
    # structural mARkdown punctuation
    body = re.sub(r"%~%", " ", body)        # verse hemistich separator
    body = re.sub(r"[#~|@+]", " ", body)    # paragraph / continuation / segment
    body = re.sub(r"\[[^\]]*\]", " ", body) # bracketed editorial
    body = re.sub(r"\(\d+\)", " ", body)    # numbering
    body = re.sub(r"\s+", " ", body)
    return body.strip()

def tokenize(text):
    # split on whitespace and latin/arabic punctuation; keep arabic letters
    return [t for t in re.split(r"[\s\.,;:!?()«»\"'،؛؟\-/\\\u060c]+", text) if t]

# ── chunking (≈ prepare_dia_chunks.chunk_text) ───────────────────────────
def chunk_words(words, size=280, overlap=40):
    if len(words) <= size:
        return [" ".join(words)]
    out, start = [], 0
    while start < len(words):
        end = min(start + size, len(words))
        out.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start = end - overlap
    return out

def sample_chunks(chunks, cap):
    """Evenly down-sample a work's chunks to <= cap, preserving order/coverage."""
    if len(chunks) <= cap:
        return list(enumerate(chunks))
    step = len(chunks) / cap
    idx = sorted({int(i * step) for i in range(cap)})
    return [(i, chunks[i]) for i in idx]

# ── salient-concept selection for co-occurrence ──────────────────────────
def salient_concepts(concept_vec, top=6):
    items = sorted(concept_vec.items(), key=lambda kv: kv[1], reverse=True)
    return [k for k, v in items[:top] if v > 0]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", "-i", required=True, help="OpenITI corpus root")
    ap.add_argument("--outdir", "-o", default="public/data")
    ap.add_argument("--chunk-size", type=int, default=280)
    ap.add_argument("--chunk-cap", type=int, default=90,
                    help="max search chunks kept per work (even-sampled)")
    args = ap.parse_args()

    root = Path(args.input)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    works_out = []
    all_chunks = []
    work_token_freq = {}      # uri -> Counter of normalised content tokens
    chunk_id = 0

    # vocabulary stopword guard for shared-vocab: ignore the very top function-y
    # tokens by collecting global df later; here keep raw per-work counts.
    for uri, meta in WORKS.items():
        wdir = root / uri
        if not wdir.is_dir():
            print(f"  ⚠ missing {uri}", file=sys.stderr)
            continue
        # primary version file
        cand = [p for p in wdir.iterdir()
                if re.search(r"-(ara|per)\d", p.name)
                and not p.name.endswith((".yml", ".completed"))
                and not p.name.startswith("._")]
        if not cand:
            cand = [p for p in wdir.iterdir()
                    if p.name.endswith(".completed") and not p.name.startswith("._")]
        if not cand:
            print(f"  ⚠ no text file in {uri}", file=sys.stderr)
            continue
        primary = sorted(cand, key=lambda p: p.stat().st_size, reverse=True)[0]

        raw = primary.read_text(encoding="utf-8", errors="ignore")
        oi_meta = read_meta_block(raw)
        body = clean_body(raw)
        tokens = tokenize(body)
        wc = len(tokens)
        if wc == 0:
            continue

        tokens_norm = [normalize_ar(t) for t in tokens]
        # concept frequencies per 1000 words
        hits = concept_hits(tokens_norm)
        per_k = {c["key"]: round(hits.get(c["key"], 0) / wc * 1000, 3) for c in CONCEPTS}

        # content token frequency (for shared vocab) — keep tokens of length >=3
        ctr = Counter(strip_proclitics(t) for t in tokens_norm if len(t) >= 3)
        work_token_freq[uri] = ctr

        ah = int(re.match(r"(\d+)", uri).group(1))
        ce = ah_to_ce(ah)
        city = CITIES[meta["city"]]

        # KWIC samples: first occurrence sentence for the top concept (illustrative)
        sample = body[:240]

        works_out.append({
            "id": uri,
            "author_tr": meta["author_tr"], "author_en": meta["author_en"],
            "author_ar": meta["author_ar"], "author_fa": meta["author_fa"],
            "title_tr": meta["title_tr"], "title_en": meta["title_en"],
            "title_ar": meta["title_ar"], "title_fa": meta["title_fa"],
            "death_ah": ah, "death_ce": ce,
            "lang": meta["lang"], "genre": meta["genre"],
            "city": meta["city"],
            "city_tr": city["tr"], "city_en": city["en"],
            "city_ar": city["ar"], "city_fa": city["fa"],
            "lat": city["lat"], "lng": city["lng"],
            "words": wc,
            "concepts": per_k,
            "sample": sample,
            "oi_author": oi_meta.get("AuthorNAME", ""),
            "oi_subject": oi_meta.get("BookSUBJ", ""),
        })

        # chunks (down-sampled per work to keep the client index light;
        # the full set is available by raising --chunk-cap)
        full_chunks = chunk_words(tokens, size=args.chunk_size)
        kept = sample_chunks(full_chunks, args.chunk_cap)
        for ci, ch in kept:
            all_chunks.append({
                "_id": chunk_id,
                "w": uri,
                "atr": meta["author_tr"], "aen": meta["author_en"],
                "ttr": meta["title_tr"], "ten": meta["title_en"],
                "lang": meta["lang"], "ah": ah,
                "c": ci,
                "t": ch[:700],
            })
            chunk_id += 1

        print(f"  ✓ {uri:52s} {wc:>9,} w  {len(kept):>4}/{len(full_chunks)} chunks")

    works_out.sort(key=lambda w: w["death_ah"])

    # ── concept co-occurrence graph ──────────────────────────────────────
    # nodes = concepts; edge weight = number of works where both are salient
    sal = {}
    for w in works_out:
        sal[w["id"]] = set(salient_concepts(w["concepts"], top=6))
    pair = Counter()
    for s in sal.values():
        s = list(s)
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                a, b = sorted((s[i], s[j]))
                pair[(a, b)] += 1
    concept_net = {
        "nodes": [{"id": c["key"], "label_tr": c["label_tr"], "label_en": c["label_en"],
                   "label_ar": c["label_ar"], "label_fa": c["label_fa"], "cat": c["cat"],
                   "total": round(sum(w["concepts"][c["key"]] for w in works_out), 2)}
                  for c in CONCEPTS],
        "edges": [{"s": a, "t": b, "w": n} for (a, b), n in pair.items() if n >= 2],
    }

    # ── work↔work shared-vocabulary graph ───────────────────────────────
    # global document frequency to down-weight ubiquitous tokens
    df = Counter()
    for ctr in work_token_freq.values():
        for tok in ctr:
            df[tok] += 1
    N = len(work_token_freq)
    # keep "distinctive" tokens: appear in >=2 and <= N-2 works, length>=3
    def top_terms(ctr, k=400):
        scored = []
        total = sum(ctr.values()) or 1
        for tok, cnt in ctr.items():
            d = df[tok]
            if d < 2 or d > N - 1:
                continue
            tf = cnt / total
            idf = math.log(N / d)
            scored.append((tok, tf * idf))
        scored.sort(key=lambda x: x[1], reverse=True)
        return set(t for t, _ in scored[:k])

    profiles = {uri: top_terms(ctr) for uri, ctr in work_token_freq.items()}
    sv_edges = []
    uris = list(profiles.keys())
    for i in range(len(uris)):
        for j in range(i + 1, len(uris)):
            a, b = uris[i], uris[j]
            inter = profiles[a] & profiles[b]
            union = profiles[a] | profiles[b]
            if not union:
                continue
            jac = len(inter) / len(union)
            if jac > 0.04:
                sv_edges.append({"s": a, "t": b, "w": round(jac, 4),
                                 "shared": len(inter)})
    sv_edges.sort(key=lambda e: e["w"], reverse=True)
    shared_vocab = {"edges": sv_edges}

    # ── concepts metadata file ──────────────────────────────────────────
    concepts_out = [{
        "key": c["key"], "cat": c["cat"],
        "label_tr": c["label_tr"], "label_en": c["label_en"],
        "label_ar": c["label_ar"], "label_fa": c["label_fa"],
        "variants": c["variants"],
        "zahir_tr": c["zahir_tr"], "zahir_en": c["zahir_en"],
        "zahir_ar": c["zahir_ar"], "zahir_fa": c["zahir_fa"],
    } for c in CONCEPTS]

    # ── corpus rollup stats ─────────────────────────────────────────────
    total_words = sum(w["words"] for w in works_out)
    authors = sorted(set(w["author_tr"] for w in works_out))
    cities = sorted(set(w["city"] for w in works_out))
    by_lang = Counter(w["lang"] for w in works_out)
    by_century = Counter((w["death_ah"] - 1) // 100 + 1 for w in works_out)
    stats = {
        "works": len(works_out),
        "total_words": total_words,
        "authors": len(authors),
        "cities": len(cities),
        "langs": dict(by_lang),
        "ah_min": min(w["death_ah"] for w in works_out),
        "ah_max": max(w["death_ah"] for w in works_out),
        "ce_min": min(w["death_ce"] for w in works_out),
        "ce_max": max(w["death_ce"] for w in works_out),
        "concepts": len(CONCEPTS),
        "chunks": len(all_chunks),
        "by_century_ah": {str(k): v for k, v in sorted(by_century.items())},
    }

    # ── write ────────────────────────────────────────────────────────────
    (outdir / "corpus.json").write_text(json.dumps(works_out, ensure_ascii=False), encoding="utf-8")
    (outdir / "concepts.json").write_text(json.dumps(concepts_out, ensure_ascii=False), encoding="utf-8")
    (outdir / "chunks.json").write_text(json.dumps(all_chunks, ensure_ascii=False), encoding="utf-8")
    (outdir / "concept_network.json").write_text(json.dumps(concept_net, ensure_ascii=False), encoding="utf-8")
    (outdir / "shared_vocab.json").write_text(json.dumps(shared_vocab, ensure_ascii=False), encoding="utf-8")
    (outdir / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 64)
    print(f"  works            {stats['works']}")
    print(f"  total words      {total_words:,}")
    print(f"  authors / cities {stats['authors']} / {stats['cities']}")
    print(f"  AH range         {stats['ah_min']}–{stats['ah_max']}  (CE {stats['ce_min']}–{stats['ce_max']})")
    print(f"  chunks           {len(all_chunks):,}")
    print(f"  concept edges    {len(concept_net['edges'])}")
    print(f"  shared-vocab edges {len(sv_edges)}")
    print(f"  → {outdir}/")
    print("=" * 64)

if __name__ == "__main__":
    main()
