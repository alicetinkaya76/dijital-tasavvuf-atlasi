# -*- coding: utf-8 -*-
"""
works_meta.py — Curated bibliographic layer for the 22-work corpus
==================================================================
The OpenITI mARkdown files carry author names + death years in their
`#META#` headers (for Arabic texts) but lack the *biographical geography*
(activity city, lat/lng) and consistent Latin transliterations the atlas
needs — and the Persian (Ganjoor) files carry almost no metadata at all.

This table is the hand-verified bibliographic spine. It is keyed by the
OpenITI work URI (folder name). Text statistics (word counts, concept
frequencies, chunks, edges) are COMPUTED from the texts by
prepare_corpus.py; only the bibliographic identity below is curated.

Geography follows the author's principal city of activity (not birthplace),
per the convention used in the article: Baghdad → Khorasan/Nishapur → Konya.

Coordinates: decimal degrees, WGS84.
"""

# AH→CE conversion used throughout: CE ≈ 622 + AH * 0.970224
def ah_to_ce(ah):
    return round(622 + ah * 0.970224)

CITIES = {
    "Bağdat":            {"lat": 33.31, "lng": 44.36, "tr": "Bağdat", "en": "Baghdad", "ar": "بغداد",   "fa": "بغداد"},
    "Tüster":            {"lat": 32.05, "lng": 48.86, "tr": "Tüster (Şûşter)", "en": "Tustar (Shushtar)", "ar": "تُستر", "fa": "شوشتر"},
    "Tirmiz":            {"lat": 37.22, "lng": 67.28, "tr": "Tirmiz (Termez)", "en": "Tirmidh (Termez)", "ar": "ترمذ", "fa": "ترمذ"},
    "Buhârâ":            {"lat": 39.77, "lng": 64.42, "tr": "Buhârâ", "en": "Bukhara", "ar": "بخارى",   "fa": "بخارا"},
    "Nîşâbur":           {"lat": 36.21, "lng": 58.79, "tr": "Nîşâbur", "en": "Nishapur", "ar": "نيسابور", "fa": "نیشابور"},
    "İsfahan":           {"lat": 32.65, "lng": 51.67, "tr": "İsfahan", "en": "Isfahan", "ar": "أصفهان",  "fa": "اصفهان"},
    "Lahor":             {"lat": 31.55, "lng": 74.34, "tr": "Lahor", "en": "Lahore", "ar": "لاهور",     "fa": "لاهور"},
    "Herat":             {"lat": 34.35, "lng": 62.20, "tr": "Herat", "en": "Herat", "ar": "هَراة",      "fa": "هرات"},
    "Tûs":               {"lat": 36.49, "lng": 59.55, "tr": "Tûs", "en": "Tus", "ar": "طُوس",          "fa": "توس"},
    "Konya":             {"lat": 37.87, "lng": 32.49, "tr": "Konya", "en": "Konya", "ar": "قونية",      "fa": "قونیه"},
}

# Keyed by OpenITI work URI (folder name).
# author / title carry four scripts where known; ar/fa originals where the
# tradition has them. region = coarse zone for the map heat layer.
WORKS = {
    "0243HarithMuhasibi.Ricaya": {
        "author_tr": "Hâris el-Muhâsibî", "author_en": "al-Ḥārith al-Muḥāsibī",
        "author_ar": "الحارث المحاسبي", "author_fa": "حارث محاسبی",
        "title_tr": "er-Riâye li-hukûkıllâh", "title_en": "al-Riʿāya li-ḥuqūq Allāh",
        "title_ar": "الرعاية لحقوق الله", "title_fa": "الرعایة لحقوق الله",
        "city": "Bağdat", "lang": "ara", "genre": "ahlak",
    },
    "0283SahlTustari.Tafsir": {
        "author_tr": "Sehl et-Tüsterî", "author_en": "Sahl al-Tustarī",
        "author_ar": "سهل بن عبد الله التستري", "author_fa": "سهل تستری",
        "title_tr": "Tefsîrü't-Tüsterî", "title_en": "Tafsīr al-Tustarī",
        "title_ar": "تفسير التستري", "title_fa": "تفسیر تستری",
        "city": "Tüster", "lang": "ara", "genre": "tefsir",
    },
    "0286AbuSacidKharraz.KitabSidq": {
        "author_tr": "Ebû Saîd el-Harrâz", "author_en": "Abū Saʿīd al-Kharrāz",
        "author_ar": "أبو سعيد الخرّاز", "author_fa": "ابوسعید خرّاز",
        "title_tr": "Kitâbü's-sıdk", "title_en": "Kitāb al-Ṣidq",
        "title_ar": "كتاب الصدق", "title_fa": "کتاب الصدق",
        "city": "Bağdat", "lang": "ara", "genre": "ahlak",
    },
    "0298Junayd.Rasail": {
        "author_tr": "Cüneyd-i Bağdâdî", "author_en": "al-Junayd al-Baghdādī",
        "author_ar": "الجنيد البغدادي", "author_fa": "جنید بغدادی",
        "title_tr": "Resâil", "title_en": "Rasāʾil (Epistles)",
        "title_ar": "رسائل الجنيد", "title_fa": "رسائل جنید",
        "city": "Bağdat", "lang": "ara", "genre": "risale",
    },
    "0320HakimTirmidhi.KhatmAwliya": {
        "author_tr": "Hakîm et-Tirmizî", "author_en": "al-Ḥakīm al-Tirmidhī",
        "author_ar": "الحكيم الترمذي", "author_fa": "حکیم ترمذی",
        "title_tr": "Hatmü'l-evliyâ", "title_en": "Khatm al-Awliyāʾ",
        "title_ar": "ختم الأولياء", "title_fa": "ختم الاولیاء",
        "city": "Tirmiz", "lang": "ara", "genre": "velayet",
    },
    "0320HakimTirmidhi.NawadirUsul": {
        "author_tr": "Hakîm et-Tirmizî", "author_en": "al-Ḥakīm al-Tirmidhī",
        "author_ar": "الحكيم الترمذي", "author_fa": "حکیم ترمذی",
        "title_tr": "Nevâdirü'l-usûl", "title_en": "Nawādir al-Uṣūl",
        "title_ar": "نوادر الأصول", "title_fa": "نوادر الاصول",
        "city": "Tirmiz", "lang": "ara", "genre": "hadis",
    },
    "0380AbuBakrKalabadhi.TacarrufLiMadhhabAhlTasawwuf": {
        "author_tr": "Kelâbâzî", "author_en": "al-Kalābādhī",
        "author_ar": "أبو بكر الكلاباذي", "author_fa": "کلابادی",
        "title_tr": "et-Taarruf li-mezhebi ehli't-tasavvuf", "title_en": "al-Taʿarruf li-Madhhab Ahl al-Taṣawwuf",
        "title_ar": "التعرف لمذهب أهل التصوف", "title_fa": "التعرف لمذهب اهل التصوف",
        "city": "Buhârâ", "lang": "ara", "genre": "tarikat",
    },
    "0386AbuTalibMakki.QutQulub": {
        "author_tr": "Ebû Tâlib el-Mekkî", "author_en": "Abū Ṭālib al-Makkī",
        "author_ar": "أبو طالب المكي", "author_fa": "ابوطالب مکی",
        "title_tr": "Kûtü'l-kulûb", "title_en": "Qūt al-Qulūb",
        "title_ar": "قوت القلوب", "title_fa": "قوت القلوب",
        "city": "Bağdat", "lang": "ara", "genre": "ahlak",
    },
    "0412Sulami.CuyubNafs": {
        "author_tr": "Sülemî", "author_en": "al-Sulamī",
        "author_ar": "أبو عبد الرحمن السلمي", "author_fa": "سلمی",
        "title_tr": "Uyûbü'n-nefs ve müdâvâtühâ", "title_en": "ʿUyūb al-Nafs",
        "title_ar": "عيوب النفس ومداواتها", "title_fa": "عیوب النفس",
        "city": "Nîşâbur", "lang": "ara", "genre": "ahlak",
    },
    "0412Sulami.TabaqatSufiyya": {
        "author_tr": "Sülemî", "author_en": "al-Sulamī",
        "author_ar": "أبو عبد الرحمن السلمي", "author_fa": "سلمی",
        "title_tr": "Tabakātü's-sûfiyye", "title_en": "Ṭabaqāt al-Ṣūfiyya",
        "title_ar": "طبقات الصوفية", "title_fa": "طبقات الصوفیه",
        "city": "Nîşâbur", "lang": "ara", "genre": "tabakat",
    },
    "0412Sulami.Tafsir": {
        "author_tr": "Sülemî", "author_en": "al-Sulamī",
        "author_ar": "أبو عبد الرحمن السلمي", "author_fa": "سلمی",
        "title_tr": "Hakâiku't-tefsîr", "title_en": "Ḥaqāʾiq al-Tafsīr",
        "title_ar": "حقائق التفسير", "title_fa": "حقائق التفسیر",
        "city": "Nîşâbur", "lang": "ara", "genre": "tefsir",
    },
    "0430AbuNucaymIsbahani.HilyatAwliya": {
        "author_tr": "Ebû Nuaym el-İsfahânî", "author_en": "Abū Nuʿaym al-Iṣfahānī",
        "author_ar": "أبو نعيم الأصفهاني", "author_fa": "ابونعیم اصفهانی",
        "title_tr": "Hilyetü'l-evliyâ", "title_en": "Ḥilyat al-Awliyāʾ",
        "title_ar": "حلية الأولياء", "title_fa": "حلیة الاولیاء",
        "city": "İsfahan", "lang": "ara", "genre": "tabakat",
    },
    "0464CaliHujwiri.KashfMahjub": {
        "author_tr": "Hücvîrî", "author_en": "al-Hujwīrī",
        "author_ar": "علي بن عثمان الهجويري", "author_fa": "علی بن عثمان هجویری",
        "title_tr": "Keşfü'l-mahcûb", "title_en": "Kashf al-Maḥjūb",
        "title_ar": "كشف المحجوب", "title_fa": "کشف المحجوب",
        "city": "Lahor", "lang": "per", "genre": "tarikat",
    },
    "0465IbnHawazinQushayri.LataifIsharat": {
        "author_tr": "Kuşeyrî", "author_en": "al-Qushayrī",
        "author_ar": "عبد الكريم القشيري", "author_fa": "عبدالکریم قشیری",
        "title_tr": "Letâifü'l-işârât", "title_en": "Laṭāʾif al-Ishārāt",
        "title_ar": "لطائف الإشارات", "title_fa": "لطائف الاشارات",
        "city": "Nîşâbur", "lang": "ara", "genre": "tefsir",
    },
    "0465IbnHawazinQushayri.RisalaQushayriyya": {
        "author_tr": "Kuşeyrî", "author_en": "al-Qushayrī",
        "author_ar": "عبد الكريم القشيري", "author_fa": "عبدالکریم قشیری",
        "title_tr": "er-Risâletü'l-Kuşeyriyye", "title_en": "al-Risāla al-Qushayriyya",
        "title_ar": "الرسالة القشيرية", "title_fa": "رساله قشیریه",
        "city": "Nîşâbur", "lang": "ara", "genre": "risale",
    },
    "0481AnsariHarawi.ManazilSairin": {
        "author_tr": "Hâce Abdullah el-Ensârî", "author_en": "ʿAbd Allāh al-Anṣārī al-Harawī",
        "author_ar": "عبد الله الأنصاري الهروي", "author_fa": "خواجه عبدالله انصاری",
        "title_tr": "Menâzilü's-sâirîn", "title_en": "Manāzil al-Sāʾirīn",
        "title_ar": "منازل السائرين", "title_fa": "منازل السائرین",
        "city": "Herat", "lang": "ara", "genre": "tarikat",
    },
    "0505Ghazali.IhyaCulumDin": {
        "author_tr": "Gazzâlî", "author_en": "al-Ghazālī",
        "author_ar": "أبو حامد الغزالي", "author_fa": "ابوحامد غزالی",
        "title_tr": "İhyâü ulûmi'd-dîn", "title_en": "Iḥyāʾ ʿUlūm al-Dīn",
        "title_ar": "إحياء علوم الدين", "title_fa": "احیاء علوم الدین",
        "city": "Tûs", "lang": "ara", "genre": "ahlak",
    },
    "0618FaridDinCattar.IlahiNama": {
        "author_tr": "Ferîdüddin Attâr", "author_en": "Farīd al-Dīn ʿAṭṭār",
        "author_ar": "فريد الدين العطار", "author_fa": "فریدالدین عطار",
        "title_tr": "İlâhînâme", "title_en": "Ilāhī-nāma",
        "title_ar": "إلهي نامه", "title_fa": "الهی‌نامه",
        "city": "Nîşâbur", "lang": "per", "genre": "manzum",
    },
    "0618FaridDinCattar.MantiqTayr": {
        "author_tr": "Ferîdüddin Attâr", "author_en": "Farīd al-Dīn ʿAṭṭār",
        "author_ar": "فريد الدين العطار", "author_fa": "فریدالدین عطار",
        "title_tr": "Mantıku't-tayr", "title_en": "Manṭiq al-Ṭayr",
        "title_ar": "منطق الطير", "title_fa": "منطق‌الطیر",
        "city": "Nîşâbur", "lang": "per", "genre": "manzum",
    },
    "0618FaridDinCattar.TadhkiratAwliya": {
        "author_tr": "Ferîdüddin Attâr", "author_en": "Farīd al-Dīn ʿAṭṭār",
        "author_ar": "فريد الدين العطار", "author_fa": "فریدالدین عطار",
        "title_tr": "Tezkiretü'l-evliyâ", "title_en": "Tadhkirat al-Awliyāʾ",
        "title_ar": "تذكرة الأولياء", "title_fa": "تذکرةالاولیاء",
        "city": "Nîşâbur", "lang": "per", "genre": "tabakat",
    },
    "0632AbuHafsSuhrawardi.CawarifMacarif": {
        "author_tr": "Ebû Hafs es-Sühreverdî", "author_en": "Abū Ḥafṣ al-Suhrawardī",
        "author_ar": "أبو حفص السهروردي", "author_fa": "ابوحفص سهروردی",
        "title_tr": "Avârifü'l-maârif", "title_en": "ʿAwārif al-Maʿārif",
        "title_ar": "عوارف المعارف", "title_fa": "عوارف المعارف",
        "city": "Bağdat", "lang": "ara", "genre": "tarikat",
    },
    "0672JalalDinRumi.Mathnawi": {
        "author_tr": "Mevlânâ Celâleddîn-i Rûmî", "author_en": "Jalāl al-Dīn Rūmī",
        "author_ar": "جلال الدين الرومي", "author_fa": "جلال‌الدین رومی",
        "title_tr": "Mesnevî-i Mânevî", "title_en": "Mathnawī-i Maʿnawī",
        "title_ar": "المثنوي المعنوي", "title_fa": "مثنوی معنوی",
        "city": "Konya", "lang": "per", "genre": "manzum",
    },
}
