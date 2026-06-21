# Dijital Tasavvuf Atlası · Digital Atlas of Sufism

> **Haritalandırır ama indirgemez** — *It maps but does not reduce.*

Klasik tasavvuf metin geleneğinin (h. 243–672 / m. 858–1274) etkileşimli, çok dilli (TR · EN · AR · FA) araştırma atlası. Hesaplamalı yöntemler bu külliyatın **dışsal** yapısını — coğrafya, kronoloji, sözcük dağılımı, aktarım ağları — haritalandırır; **bâtınî/tecrübî** muhtevayı (hâl, zevk, keşf, mârifet) ise kuşatmaz. Bu epistemik duruş arayüzün her köşesine işlenmiştir.

An interactive, multilingual research atlas of the classical Sufi textual tradition, built as the application experiment for the article *“Dijital Beşerî Bilimler ve Tasavvuf Araştırmaları.”* It is architecturally modelled on [islamicatlas.org](https://islamicatlas.org).

---

## Yedi lens · The seven lenses

| | Lens | İçerik |
|---|---|---|
| I | **Pano** / Overview | Külliyatın genel görünümü, yöntem ve sınır notu |
| II | **Harita** / Map | Müelliflerin coğrafyası; Bağdat–Nîşâbur–Konya ekseni (Leaflet) |
| III | **Zaman Çizelgesi** / Timeline | 22 eserin ölçekli kronolojisi, kavram vurgusu |
| IV | **Kavram Madenciliği** / Concept Mining | Dağılım çubukları · ortak-geçiş ağı (D3) · kavram×yüzyıl ısı haritası · nesiller arası akış |
| V | **Silsile Ağı** / Transmission | Hoca–talebe ve metinsel etki ağı (D3) |
| VI | **Külliyat Tarayıcı** / Corpus Browser | Sıralanabilir künye tablosu · TR/AR/FA toleranslı tam-metin arama (MiniSearch) |
| VII | **AI Rehber** / AI Guide | 22 metne dayalı RAG sohbeti; manevî hüküm vermez |

Her kavramın bir **zâhir / bâtın notu** vardır: ne sayıldığı ve sayımdan ne kaçtığı, bir kenar hâşiyesi (gloss) olarak gösterilir.

---

## Kurulum · Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Gerekli · Requirements: Node 18+.

### Veri hattını yeniden üretmek · Reproducing the data pipeline

Tüm `public/data/*.json` dosyaları, dahil edilen Python betikleriyle ham OpenITI metinlerinden yeniden üretilebilir:

```bash
python3 scripts/prepare_corpus.py --input <openiti_dizini> --outdir public/data
python3 scripts/build_silsile.py
```

Betikler: `works_meta.py` (künye tablosu), `concept_lexicon.py` (kavram sözlüğü: varyantlar + zâhir/bâtın notları), `prepare_corpus.py` (ana hat: temizleme, normalleştirme, sayım, parçalama, ağ üretimi), `build_silsile.py` (kürasyonlu aktarım ağı). Yöntemin tam dökümü için **[DATA_DICTIONARY.md](./DATA_DICTIONARY.md)**.

---

## AI Rehber yapılandırması · Configuring the AI guide

Rehber **anahtar olmadan da çalışır**: tam-metin arama ve kaynak getirme devrede kalır; yalnızca üretilen sentez adımı devre dışı olur (*graceful degradation*). Anahtar eklendiğinde, getirilen metin kesitleri bağlam olarak modele verilir (RAG).

Sağlayıcıdan bağımsızdır — OpenAI uyumlu herhangi bir `/chat/completions` ucu çalışır (öntanımlı: Groq ücretsiz katman).

```bash
cp .env.example .env
# .env içine:
VITE_LLM_KEY=...                                  # boş bırakılırsa AI üretimi kapalı
VITE_LLM_URL=https://api.groq.com/openai/v1/chat/completions
VITE_LLM_MODEL=llama-3.3-70b-versatile
```

Model üzerine **zâhir/bâtın muhafızları** uygulanır (bkz. `src/components/ai/promptBuilder.js`): rehber yalnız dışsal örüntüleri betimler, fetva/manevî hüküm vermez, bir şeyhin yerine geçmez, ve her olgusal iddiayı getirilen kesitlere dayandırır.

`.env` dosyası `.gitignore`’dadır; depoya gönderilmez.

---

## Dil eklemek · Adding a language

Atlas dört dili (tr/en/ar/fa) birinci sınıf taşır. Beşinci bir dil için:

1. `src/data/i18n.js` → `T` nesnesine yeni dil kodu altında çevirileri ekleyin.
2. `src/data/i18n-utils.js` → `LANGS` dizisine `{ code, label, native }` ekleyin; RTL ise `isRTL`’i güncelleyin.
3. Veri alanları `_xx` ekiyle çözülür (örn. `author_de`). `scripts/works_meta.py` ve `scripts/concept_lexicon.py` içine yeni dilin alanlarını ekleyip hattı yeniden çalıştırın.
4. RTL bir dilse `src/styles/rtl.css` içine font eşlemesini ekleyin.

Çeviri kapsamı footer’da gösterilir; eksik anahtarlar İngilizce/Türkçe’ye düşer.

---

## GitHub Pages’e dağıtım · Deploying

Depo, otomatik dağıtım için bir GitHub Actions akışı içerir (`.github/workflows/deploy.yml`):

1. Depoyu GitHub’a gönderin. **Settings → Pages → Source: GitHub Actions** seçin.
2. `main`’e her push, projeyi `BASE_PATH=/<repo>/` ile derler ve yayımlar.
3. Kullanıcı/kurum kök sitesi (`<user>.github.io`) için akıştaki `BASE_PATH`’i `/` yapın.

Elle dağıtım:

```bash
BASE_PATH=/<repo>/ npm run build
# dist/ içeriğini gh-pages dalına veya statik sunucuya koyun
cp dist/index.html dist/404.html   # SPA güvenliği
```

`vite.config.js` `BASE_PATH` ortam değişkenini okur; varsayılan `/`.

### Zenodo DOI (arşivleme · archival)

Çift-kör hakemlik için kalıcı, anonim bir sürüm bağlantısı:

1. Sürüm hazır olduğunda GitHub’da bir **release** (örn. `v1.0.0`) oluşturun.
2. [Zenodo](https://zenodo.org) hesabınızı GitHub deposuyla ilişkilendirin (**Zenodo → GitHub**), depoyu “On” yapın.
3. Yeni release otomatik olarak Zenodo’da arşivlenir ve bir **DOI** alır.
4. DOI rozetini bu README’ye ve makaleye ekleyin. Zenodo kaydı yazar alanlarını gizli tutacak şekilde düzenlenebilir (kabul sonrası açılır).

> Çift-kör not: Bu depoda yazar/kurum bilgisi bilinçli olarak yer almaz. Kabul sonrası eklenir.

---

## Kaynak metinler & atıf · Source texts & citation

Birincil metinler **OpenITI** (Open Islamicate Texts Initiative) mARkdown külliyatından alınmıştır. OpenITI metinleri açık lisanslıdır; lütfen kullanırken atıf veriniz:

> Nigst, L., Romanov, M., Savant, S. B., Seydi, M., & Verkinderen, P. (2024). *OpenITI: a Machine-Readable Corpus of Islamicate Texts.* Zenodo. https://doi.org/10.5281/zenodo.4075046

Eser düzeyindeki künyeler (Latin/Arapça/Farsça müellif ve eser adları, şehirler, koordinatlar) `scripts/works_meta.py` içinde kürasyonludur. Farsça metinler (Hücvîrî, Attâr, Mevlânâ) OpenITI’nin Ganjoor tabanlı sürümlerinden gelir ve asgari meta veriye sahip olduğundan künyeleri elle tamamlanmıştır.

### Bu atlası atıf · Citing this atlas

```
[Yazar gizli / Author redacted]. (2025). Dijital Tasavvuf Atlası
(Digital Atlas of Sufism) [Yazılım/Software]. https://doi.org/<Zenodo-DOI>
```

---

## Mimari · Architecture

```
src/
  App.jsx                 lens yönlendirme (hash) + kabuk
  ui-context.jsx          dil + Doğu rakamı durumu
  data/i18n.js            dört dilli UI sözlüğü
  hooks/useAsyncData.jsx  modül-önbellekli JSON getirme
  utils/normalize.js      TR+AR+FA katlama, tokenleştirme, rakam biçimleme
  config/                 colors.js (tezhip paleti) · ai.js
  components/
    dashboard/ mapview/ timeline/ concepts/ silsile/ corpus/ ai/ shared/
  styles/                 base · shell · lenses · rtl
public/data/              corpus · concepts · chunks · *_network · stats
scripts/                  Python veri hattı
```

**Yığın · Stack:** React 18 + Vite · Leaflet (doğrudan) · D3 (force + el yapımı alluvial) · MiniSearch · sağlayıcıdan bağımsız LLM istemcisi · PWA (service worker + manifest).

**Tasarım · Design:** İslâm yazma eseri tezhibinden devşirilen palet ve tipografi (Amiri · Vazirmatn · Hanken Grotesk · Spectral). İmza öğesi, *matn / hâşiye* (metin / kenar şerhi) ayrımıdır: sayılan veri ana blokta, sayımdan kaçan ise altın bir cetvelin yanında italik şerh olarak.

---

## Lisans · License

Kod: MIT (öneri). Metin verileri: OpenITI lisans koşullarına tâbidir. Atıf zorunludur.
