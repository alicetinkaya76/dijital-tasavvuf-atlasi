#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_silsile.py — curated transmission network for the 16 authors
==================================================================
A hand-curated directed graph (kürasyonlu çizge) connecting the corpus's
authors. Nodes are the 16 authors (derived from corpus.json); edges are
historically-attested links of three kinds:

  hoca     teacher → student (documented samāʿ / companionship)
  metin    textual influence  (B demonstrably draws on / cites A's book)
  gelenek  shared lineage / order / school affiliation

This is the *zāhir* of transmission: it maps attested human and textual
links. It does NOT claim to map the bāṭin of spiritual inheritance — the
nisba of the heart that the tradition itself says cannot be charted.

Sources for the curation are standard reference works (TDV İA / EI entries
for each figure); each edge carries a short ``note`` naming the relation.
Edges are intentionally sparse and defensible rather than exhaustive.
"""
import json, re
from pathlib import Path

CORPUS = Path("public/data/corpus.json")
OUT = Path("public/data/silsile.json")

corpus = json.loads(CORPUS.read_text(encoding="utf-8"))

# author id = death AH + latin family slug (one node per *author*, not work)
def author_id(w):
    fam = re.sub(r"[^A-Za-z]", "", w["author_en"].split()[-1])
    return f"{w['death_ah']:04d}{fam}"

authors = {}
for w in corpus:
    aid = author_id(w)
    if aid not in authors:
        authors[aid] = {
            "id": aid,
            "name_tr": w["author_tr"], "name_en": w["author_en"],
            "name_ar": w["author_ar"], "name_fa": w["author_fa"],
            "death_ah": w["death_ah"], "death_ce": w["death_ce"],
            "city": w["city"], "lat": w["lat"], "lng": w["lng"],
            "lang": w["lang"],
            "works": [],
        }
    authors[aid]["works"].append({"title_tr": w["title_tr"], "title_en": w["title_en"], "id": w["id"]})

# convenience handles
def aid_of(family_ah):
    for k in authors:
        if k.startswith(f"{family_ah:04d}"):
            return k
    raise KeyError(family_ah)

MUHASIBI = aid_of(243); TUSTARI = aid_of(283); KHARRAZ = aid_of(286)
JUNAYD = aid_of(298);   TIRMIDHI = aid_of(320); KALABADHI = aid_of(380)
MAKKI = aid_of(386);    SULAMI = aid_of(412);   ISBAHANI = aid_of(430)
HUJWIRI = aid_of(464);  QUSHAYRI = aid_of(465);  ANSARI = aid_of(481)
GHAZALI = aid_of(505);  ATTAR = aid_of(618);     SUHRAWARDI = aid_of(632)
RUMI = aid_of(672)

# (source, target, kind, note_tr, note_en)
EDGES = [
    (MUHASIBI, JUNAYD, "metin", "Cüneyd, Muhâsibî'nin muhâsebe ahlâkını devralır", "Junayd inherits al-Muḥāsibī's ethic of self-examination"),
    (KHARRAZ, JUNAYD, "gelenek", "Bağdat mektebinin çağdaşları", "contemporaries of the Baghdad school"),
    (JUNAYD, KHARRAZ, "gelenek", "fenâ-bekâ kavram dağarcığını paylaşırlar", "share the fanāʾ–baqāʾ vocabulary"),
    (TUSTARI, SULAMI, "metin", "Sülemî, Tüsterî'nin işârî tefsirini aktarır", "al-Sulamī transmits al-Tustarī's mystical tafsīr"),
    (JUNAYD, SULAMI, "metin", "Tabakāt, Cüneyd'i merkez halka olarak kurar", "the Ṭabaqāt sets Junayd as the central link"),
    (TIRMIDHI, SULAMI, "metin", "velâyet bahsi Tirmizî'den beslenir", "the sainthood discussion draws on al-Tirmidhī"),
    (SULAMI, QUSHAYRI, "hoca", "Kuşeyrî, Sülemî'nin talebesidir", "al-Qushayrī was al-Sulamī's student"),
    (JUNAYD, QUSHAYRI, "metin", "Risâle, Cüneyd rivayetleriyle örülüdür", "the Risāla is woven with Junayd reports"),
    (MAKKI, GHAZALI, "metin", "İhyâ, Kûtü'l-kulûb'u büyük ölçüde temel alır", "the Iḥyāʾ rests substantially on the Qūt al-Qulūb"),
    (MUHASIBI, GHAZALI, "metin", "Gazzâlî, Muhâsibî'nin kalp ilmini sürdürür", "al-Ghazālī continues al-Muḥāsibī's science of the heart"),
    (QUSHAYRI, GHAZALI, "gelenek", "Nîşâbur–Horasan tasavvuf muhiti", "the Nishapur–Khurasan Sufi milieu"),
    (SULAMI, ANSARI, "metin", "Menâzil, Sülemî geleneğinin makāmât şemasını işler", "the Manāzil refines al-Sulamī's scheme of stations"),
    (KHARRAZ, ANSARI, "metin", "fenâ tasnifinde Harrâz'a yaslanır", "leans on al-Kharrāz in classifying fanāʾ"),
    (JUNAYD, HUJWIRI, "metin", "Keşfü'l-mahcûb, Cüneyd'i ölçü alır", "the Kashf al-Maḥjūb takes Junayd as its measure"),
    (QUSHAYRI, HUJWIRI, "gelenek", "Risâle ile aynı tasnif geleneği", "the same taxonomic tradition as the Risāla"),
    (GHAZALI, SUHRAWARDI, "metin", "Avârif, İhyâ'nın âdâb çatısını sürdürür", "the ʿAwārif extends the Iḥyāʾ's framework of comportment"),
    (MAKKI, SUHRAWARDI, "metin", "Kûtü'l-kulûb'un tarîk tasavvuru", "the path-conception of the Qūt al-Qulūb"),
    (QUSHAYRI, SUHRAWARDI, "gelenek", "Sühreverdiyye'nin nazarî zemini", "the theoretical ground of the Suhrawardiyya"),
    (SULAMI, ATTAR, "metin", "Tezkire, Tabakāt'ın menâkıb geleneğini Farsça'ya taşır", "the Tadhkira carries the Ṭabaqāt's hagiography into Persian"),
    (TIRMIDHI, ATTAR, "metin", "evliyâ menkıbeleri ortak kaynak", "shared source in saints' lore"),
    (ATTAR, RUMI, "hoca", "menkıbeye göre Attâr genç Rûmî'ye Esrârnâme'yi verir", "by tradition ʿAṭṭār hands the young Rūmī the Asrār-nāma"),
    (SUHRAWARDI, RUMI, "gelenek", "Konya muhitinde Sühreverdî tesiri", "Suhrawardī's influence in the Konya milieu"),
    (TUSTARI, MAKKI, "metin", "Sâlimiyye üzerinden Tüsterî mirası", "the Tustarī heritage via the Sālimiyya"),
]

edges = [{"s": s, "t": t, "kind": k, "note_tr": ntr, "note_en": nen}
         for (s, t, k, ntr, nen) in EDGES]

# degree for node sizing
deg = {a: 0 for a in authors}
for e in edges:
    deg[e["s"]] += 1
    deg[e["t"]] += 1
for a in authors:
    authors[a]["degree"] = deg[a]

out = {"nodes": list(authors.values()), "edges": edges,
       "kinds": {
           "hoca":    {"tr": "Hoca–talebe", "en": "Teacher–student", "ar": "شيخ–مريد", "fa": "استاد–شاگرد"},
           "metin":   {"tr": "Metinsel etki", "en": "Textual influence", "ar": "تأثير نصّي", "fa": "تأثیر متنی"},
           "gelenek": {"tr": "Ortak gelenek", "en": "Shared lineage", "ar": "سلسلة مشتركة", "fa": "سلسلهٔ مشترک"},
       }}
OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print(f"silsile: {len(authors)} authors, {len(edges)} edges → {OUT}")
