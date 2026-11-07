# Süni İntellekt HR-da: nəzəriyyədən praktikaya

AmCham Azərbaycan · **NextGen HR Leaders** proqramı üçün 3 saatlıq AI təliminin təqdimatı.
Təlimçi: Nizami Tahirov.

Paylaşım üçün ictimai versiya: natiq qeydləri yoxdur. Açılanda dil (AZ / EN) və görünüş (işıqlı / qaranlıq) seçilir. Telefonda da işləyir.

## Vercel-ə deploy

1. vercel.com → **Add New → Project** → bu repo-nu seçin → **Import**.
2. Framework Preset: **Other**. Build əmri boş qalsın. Output qovluğu `vercel.json` ilə `public` təyin olunub.
3. **Deploy**. Bundan sonra `main`-ə hər push saytı avtomatik yeniləyir.

Yalnız `public/` qovluğu yayımlanır. `source/` (qeydlər daxil) saytda görünmür, amma repo açıqdırsa GitHub-da oxuna bilər - repo-nu **Private** etmək tövsiyə olunur.

## İdarə

| Düymə | Nə edir |
|---|---|
| `→` `Space` `PgDn` `Enter` | Növbəti slayd |
| `←` `PgUp` `Backspace` | Əvvəlki slayd |
| `↑` / `Z` · `↓` / `X` | Animasiyada bir addım geri / irəli |
| `Home` / `End` | İlk / son slayd |
| `1`…`37` + `Enter` | Nömrə ilə keçid |
| `F` | Tam ekran |
| `O` / `G` | Bütün slaydlar |
| `R` | Animasiyanı yenidən başlat |
| `B` / `.` | Ekranı qaraltmaq |
| `?` / `Esc` | Qısayollar / bağla |

Telefonda: sağa-sola sürüşdürmə - slayd, yuxarı-aşağı sürüşdürmə - animasiya addımı, toxunma - növbəti. ⚙ düyməsi dil və görünüşü dəyişir.

## Slaydları redaktə etmək

- Slaydlar `source/slides/*.html`, sıra `source/deck.json`, ingilis mətnləri `source/i18n/en.json`.
- Dəyişiklikdən sonra: `python3 tools/build.py` → `public/assets/d/{az,en}-{light,dark}.js` yenilənir → commit və push.
- `<aside>` içindəki natiq qeydləri build zamanı silinir və sayta düşmür.
- Qaranlıq rejimdə ağ slaydların rəngləri `tools/build.py` faylındakı `DARK` cədvəli ilə çevrilir.
- Animasiya sürəti: `TIME_SCALE` (1.3 = 30% yavaş).

## Qoruma haqqında

Mətn seçimi, kopyalama, sağ klik, sürükləmə, çap və DevTools qısayolları bloklanıb, slayd datası açıq mətn kimi saxlanmır. Bu, adi istifadəçini çəkindirir, amma tam qoruma deyil: ekran görüntüsü və brauzerin özünün alətləri ilə məzmunu götürmək mümkündür.

## Struktur

```
public/index.html        oynadıcı (start pəncərəsi, naviqasiya)
public/assets/app.js     naviqasiya, qısayollar, dil/mod, qoruma
public/assets/style.css  görünüş
public/assets/d/         build.py ilə yaradılır (4 variant)
public/assets/fonts/     Montserrat, JetBrains Mono (SIL OFL)
public/assets/img/       şəkillər
source/                  slaydların mənbəyi (qeydlərlə) - yayımlanmır
tools/build.py           mənbədən public/assets/d/ qurur
vercel.json              output: public
```
