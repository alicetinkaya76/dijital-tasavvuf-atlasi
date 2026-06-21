# Veri Sözlüğü · Data Dictionary

Bu belge `public/data/` altındaki her dosyanın şemasını, kavram-sayım yöntemini ve metodolojik uyarıları belgeler. Tüm dosyalar `scripts/` içindeki Python hattıyla ham OpenITI metinlerinden üretilir ve yeniden üretilebilir.

**Külliyat özeti:** 22 eser · 4.992.778 sözcük · 16 müellif · 10 şehir · 24 kavram · 1807 arama parçası · h. 243–672 / m. 858–1274. Diller: Arapça 17, Farsça 5.

---

## 1. `stats.json` — özet sayımlar

Tek nesne. Pano lensini besler.

| Alan | Tip | Açıklama |
|---|---|---|
| `works` | int | Eser sayısı (22) |
| `total_words` | int | Temizlenmiş gövdedeki toplam belirteç (4.992.778) |
| `authors` | int | Tekil müellif sayısı (16) |
| `cities` | int | Tekil üretim merkezi (10) |
| `langs` | obj | `{ ara, per }` — dile göre eser sayısı |
| `ah_min` / `ah_max` | int | Vefat yılı aralığı (Hicrî): 243 / 672 |
| `ce_min` / `ce_max` | int | Vefat yılı aralığı (Milâdî): 858 / 1274 |
| `concepts` | int | İzlenen kavram sayısı (24) |
| `chunks` | int | Arama parçası sayısı (1807) |
| `by_century_ah` | obj | Hicrî yüzyıla göre eser dağılımı: `{3:4, 4:4, 5:8, 6:1, 7:5}` |

---

## 2. `corpus.json` — eser künyeleri + kavram profilleri

22 nesnelik dizi. Harita, Zaman, Külliyat, Kavram lenslerinin temel kaynağı.

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | str | OpenITI eser kimliği (URI tabanlı) |
| `author_tr/en/ar/fa` | str | Müellif adı, dört dilde |
| `title_tr/en/ar/fa` | str | Eser adı, dört dilde |
| `city` | str | Anahtar şehir adı (eşleştirme anahtarı) |
| `city_tr/en/ar/fa` | str | Şehir adı, dört dilde |
| `lat` / `lng` | float | Üretim merkezinin koordinatları |
| `lang` | str | `ara` \| `per` |
| `genre` | str | Tür etiketi (kürasyonlu) |
| `death_ah` / `death_ce` | int | Müellifin vefat yılı (Hicrî / Milâdî) |
| `words` | int | Bu eserin temizlenmiş sözcük sayısı |
| `concepts` | obj | `{ kavram_anahtarı: bin-sözcük-başına-sıklık }` — yalnız > 0 olanlar |
| `sample` | str | Okuma için kısa özgün-metin kesiti (OCR/markup gürültüsü içerebilir) |
| `oi_author` / `oi_subject` | str | Ham OpenITI müellif/konu etiketleri |

> **Not — `sample` alanı:** Bağlamı sezdirmek içindir, eleştirel neşir değildir; markup veya OCR kalıntısı taşıyabilir.

---

## 3. `concepts.json` — kavram sözlüğü

24 nesnelik dizi. Kavram lensinin rayını ve zâhir/bâtın notlarını besler.

| Alan | Tip | Açıklama |
|---|---|---|
| `key` | str | Latin harf anahtar (örn. `marifet`, `fena`) |
| `cat` | str | Kavram ailesi (aşağıya bkz.) |
| `label_tr/en/ar/fa` | str | Görünen etiket, dört dilde |
| `variants` | str[] | Sayımda eşleştirilen özgün-yazım varyantları (Ar./Fars.) |
| `zahir_tr/en/ar/fa` | str | **Zâhir/bâtın notu:** kavramın neyinin sayılabildiği ve neyin sayımdan kaçtığı |

**Kavram aileleri (`cat`):**

| Aile | Anlam | Sayı |
|---|---|---|
| `son` | Nihaî hâller / vahdet (fenâ, bekā, tevhîd) | 3 |
| `bilgi` | Bilgi türleri (mârifet, keşf) | 2 |
| `tecrube` | Tecrübî hâller (hâl, vecd, aşk, mahabbet, şevk…) | 7 |
| `ahlak` | Ahlâkî makamlar (zühd, sabır, tevekkül, rızâ, havf, recâ) | 6 |
| `amel` | Amel/pratik (zikir, semâ, halvet) | 3 |
| `kurum` | Kurumsal roller (velî, mürîd, şeyh) | 3 |

---

## 4. `concept_network.json` — kavram ortak-geçiş ağı

Kavram lensindeki D3 kuvvet grafiğini besler. **24 düğüm · 42 kenar.**

```jsonc
{
  "nodes": [ { "id", "label_tr/en/ar/fa", "cat", "total" } ],
  "edges": [ { "s", "t", "w" } ]
}
```

- `total` — düğümün tüm eserlerdeki birikimli sıklığı (düğüm boyutu).
- Kenar `w` — iki kavramın **aynı eserde birlikte yüksek sıklıkta** görülme derecesi (eserler üzerinden hesaplanan ortak-geçiş ağırlığı). Yön yoktur.

---

## 5. `shared_vocab.json` — eserler-arası paylaşılan söz dağarı

**105 kenar.** Eser↔eser benzerliğini, paylaşılan içerik-belirteçleri üzerinden ölçer (yaygın belirteçler belge-sıklığıyla aşağı ağırlıklanır). *Şu an arayüzde görselleştirilmiyor; ileri çalışma ve “Paylaşılan Kanon” şekli için saklı tutulmuştur.*

```jsonc
{ "edges": [ { "s", "t", "w", "shared" } ] }
```

`shared` — iki eser arasında ağırlıkça en belirleyici ortak terimler.

---

## 6. `silsile.json` — aktarım ağı

Silsile lensindeki D3 grafiğini besler. **16 düğüm · 23 kenar.** Düğümler kürasyonludur (yalnız külliyattaki müellifleri değil, aktarım zincirinin bağlayıcı halkalarını da içerir).

```jsonc
{
  "nodes": [ {
    "id", "name_tr/en/ar/fa",
    "death_ah", "death_ce", "city", "lat", "lng", "lang",
    "works": [ { "title_tr", "title_en", "id" } ],
    "degree"
  } ],
  "edges": [ { "s", "t", "kind", "note_tr", "note_en" } ],
  "kinds": [ "hoca", "metin", "gelenek" ]
}
```

**Kenar türleri:**

| `kind` | Anlam | Yön |
|---|---|---|
| `hoca` | Hoca → talebe (sohbet/icâzet) | yönlü |
| `metin` | Metinsel etki / iktibas | yönlü |
| `gelenek` | Ortak gelenek / silsile bağı | yönsüz |

> Aktarım kenarları ve notları (`note_tr/en`) ikincil literatüre dayanılarak **elle kürasyonludur**; metinden otomatik çıkarılmamıştır. Bu, atlasın “sayım” ile “yorum”u ayırma ilkesinin bir gereğidir — bu katman açıkça yorumdur.

---

## 7. `chunks.json` — tam-metin arama parçaları

1807 nesnelik dizi. MiniSearch dizinini (Külliyat + AI Rehber lensleri) besler.

| Alan | Tip | Açıklama |
|---|---|---|
| `_id` | str | Parça kimliği (`eserId#sıra`) |
| `w` | str | Kaynak eser kimliği |
| `atr` / `aen` | str | Müellif (TR / EN) |
| `ttr` / `ten` | str | Eser adı (TR / EN) |
| `lang` | str | `ara` \| `per` |
| `ah` | int | Müellifin vefat yılı (Hicrî) |
| `c` | int | Eser içi parça sırası |
| `t` | str | Özgün-yazım (Arapça/Farsça) metin gövdesi (~280 sözcük, 40 örtüşme) |

---

## Kavram-sayım yöntemi · Concept-counting methodology

`scripts/prepare_corpus.py` içindeki `concept_hits()` fonksiyonu. **Bilinçli olarak muhafazakârdır** — gevşek alt-dizi eşlemesi yapmaz, çünkü kısa kökler aşırı sayılır.

**Adımlar:**

1. **Belirteçleme.** Gövde, harf-dışı sınırlardan belirteçlere ayrılır.
2. **Normalleştirme** (`normalize_ar`). Arapça ve Farsça yazım varyantları eşitlenir: elif/hemze biçimleri, `ك→ک`, `ي→ی`, `ة→ه`, `ۀ→ه`, `ئ→ی`, vb.
3. **Proklitik ayıklama** (`strip_proclitics`). Baştaki bağlaç/harf-i tarif/edatlar yinelemeli olarak düşürülür: `وال فال بال کال لل ال و ف ب ک ل` (belirteç uzunluğu > 2 kaldıkça).
4. **Eşleme.** Bir belirteç şu durumda bir kavrama sayılır:
   - belirteç, bir varyanta birebir eşitse; **veya**
   - proklitik-ayıklanmış kök bir varyanta eşitse; **veya**
   - varyant uzunluğu ≥ 4 olmak kaydıyla, kök o varyantla **başlıyorsa** ve artık ek ≤ 2 karakterse (çoğul/zamir kuyruğu).
5. **İlk-eşleşme kazanır.** Her belirteç en çok **bir** kavrama atanır (varyant yineleme sırasındaki ilk eşleşme). Dolayısıyla bir belirteç kavramlar arasında çift sayılmaz.
6. **Sıklık.** `bin-sözcük-başına = (vuruş / eser_sözcük_sayısı) × 1000`, 3 ondalığa yuvarlanır.

### Eş-yazım (homograph) uyarısı

Kök eşlemesi **anlamı** çözemez. Bazı yüksek-frekanslı kavram terimleri tasavvuf-dışı anlamlarla eş-yazımdır:

- **ذكر** — “zikir/anma (vird)” ↔ “erkek; söz etmek”.
- **قلب** — “kalp (gönül)” ↔ “ters çevirmek; dönüşmek”.

Bu terimlerin sıklıkları, tasavvufî-olmayan kullanımın geçtiği yerlerde **bir miktar şişirilmiş** okunmalıdır. Sayılar mutlak değil, **görece eğilim** olarak yorumlanmalıdır.

### Sözcük sayısı farkı (4.99M ≈ vs 5.35M)

Hesaplanan toplam **4.992.778** sözcüktür; statik prototipte bildirilen ~5,35M’den yaklaşık **%7 düşüktür**. Sebep bir hata değil, **temizleme tercihidir** (`clean_body`): mARkdown yapısal etiketleri, editöryel imler, sayfa/varak numaraları ve meta-veri blokları belirteçlemeden önce ayıklanır; prototip daha hafif bir temizlemeyle saymıştı. Fark bu belgede şeffaf biçimde kayıt altındadır.

### Farsça metinlerin meta-verisi

Farsça eserler (Hücvîrî *Keşfü’l-Mahcûb*, Attâr, Mevlânâ) OpenITI’nin Ganjoor tabanlı sürümlerinden gelir ve asgari meta veriye sahiptir. Müellif/eser adları, şehir, koordinat ve vefat yılları `scripts/works_meta.py` içinde **elle tamamlanmıştır**.

---

## Yeniden üretilebilirlik · Reproducibility

```bash
python3 scripts/prepare_corpus.py --input <openiti_dizini> --outdir public/data
python3 scripts/build_silsile.py
```

Aynı OpenITI girdisi ve aynı `concept_lexicon.py` ile, üretilen sayımlar deterministiktir. Lexicon’u (varyant ekleme/çıkarma) veya temizleme adımlarını değiştirmek sayımları değiştirir; böyle bir durumda yukarıdaki özet sayımlar ve `stats.json` yeniden üretilmelidir.

---

## İlke · Principle

Bu sözlüğün belgelediği her şey **zâhir**dir: sayılabilir, yeniden üretilebilir, tartışılabilir dışsal yapı. Atlasın hiçbir katmanı **bâtın**ı — hâl, zevk, keşf, mârifet — temsil etme iddiasında değildir. *Haritalandırır ama indirgemez.*
