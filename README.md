# Süni İntellekt HR-da: nəzəriyyədən praktikaya

AmCham Azərbaycan · **NextGen HR Leaders** proqramı üçün 3 saatlıq AI təliminin təqdimatı.
Təlimçi: Nizami Tahirov.

Bu, statik veb saytdır: build və ya server lazım deyil. Vercel-ə birbaşa deploy olunur, internet olmadan da işləyir (şriftlər repodadır).

## Vercel-ə deploy

1. vercel.com → **Add New → Project** → bu repo-nu seçin → **Import**.
2. Framework Preset: **Other**. Build əmri və output qovluğu boş qalsın.
3. **Deploy**. Bundan sonra `main`-ə hər push saytı avtomatik yeniləyir.

## Klaviatura ilə idarə

| Düymə | Nə edir |
|---|---|
| `→` `Space` `PgDn` `↓` `Enter` | Növbəti slayd |
| `←` `PgUp` `↑` `Backspace` | Əvvəlki slayd |
| `Home` / `End` | İlk / son slayd |
| `1`…`37` + `Enter` | Nömrə ilə slayda keçid |
| `F` | Tam ekran |
| `O` və ya `G` | Bütün slaydların icmalı (klik ilə keçid) |
| `S` | Natiq qeydlərini aşağıda göstər / gizlət |
| `P` | Natiq rejimi: ayrı pəncərədə cari və növbəti slayd, qeydlər və taymer. İki pəncərə sinxron işləyir. |
| `R` | Cari slaydın animasiyasını yenidən başlat |
| `B` və ya `.` | Ekranı qaraltmaq |
| `?` | Qısayollar pəncərəsi · `Esc` bağlayır |

Siçan: ekranın sağ tərəfinə klik - növbəti, sol kənara klik - əvvəlki. Telefonda: sürüşdürmə.
Hər slaydın öz ünvanı var: `…/#11` birbaşa 11-ci slaydı açır.

**Təqdimat üçün tövsiyə:** proyektora qoşulan ekranda saytı açın, `F` basın; noutbukda `P` ilə natiq rejimini açıb qeydlərə baxın.

## Slaydları redaktə etmək

- Slaydlar `source/slides/*.html`, sıra `source/deck.json` faylındadır.
- Dəyişiklikdən sonra: `python3 tools/build.py` → `assets/slides.js` yenilənir → commit və push.
- `<aside>` içindəki mətn natiq qeydləridir; `<x-embed>` içindəki səhifələr canlı animasiyalardır.

## Struktur

```
index.html          oynadıcı
assets/app.js       naviqasiya, qısayollar, natiq rejimi
assets/style.css    görünüş
assets/slides.js    build.py ilə yaradılır
assets/fonts/       Montserrat, JetBrains Mono (SIL OFL)
assets/img/         şəkillər
source/             slaydların mənbə faylları
tools/build.py      mənbədən slides.js qurur
```
