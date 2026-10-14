# IMAGE PROMPTS — картинки, которых не хватает для полёта камеры

Видео — в `VIDEO_PROMPTS.md`. Здесь картинки, которые нужны объёмной версии главной и финалу. Порядок = приоритет.

## 0. Кадры пути — «полёт по вселенной» (6 шт.) — САМОЕ ГЛАВНОЕ

Зачем: сейчас миры сменяют друг друга вспышкой — это прыжок, а не полёт. Между мирами нужен космос: планета следующего мира, видимая издалека. При скролле камера летит к ней (звёзды проносятся мимо, астероиды на переднем плане уходят быстрее), планета растёт, камера входит в атмосферу — и открывается мир с банкой.
Путь: hero → **путь к Луне** → Luna → **путь к Сатурну** → Saturn → … → Neptune → финал.

Где делать: ChatGPT или Gemini (обычная генерация картинки), формат **16:9, горизонтально**, максимальное качество. Банок и текста в кадре нет.
Если генератор даёт выбрать вариант — берите тот, где планета **не у самого края** и вокруг много тёмного космоса.

Общий хвост к каждому промпту (приклеить в конце):
`, view from open space, the planet in the middle distance slightly right of center, large but fully visible, a few dark asteroids and fine dust very close to the camera in the corners for depth, deep black space with stars and a faint nebula, cinematic photoreal space photography, IMAX, dramatic rim light, 16:9, no text, no logos, no spacecraft, no people`

| Файл | Промпт (начало) |
|---|---|
| `path_luna.png` | `Approaching a giant silver-grey moon with deep craters, cold blue light on its edge` |
| `path_saturn.png` | `Approaching Saturn with wide glowing golden champagne rings crossing the frame, warm light` |
| `path_venus.png` | `Approaching a pearl-pink planet wrapped in soft swirling rose and cream clouds, dreamy light` |
| `path_mars.png` | `Approaching a rust-red planet with copper canyons, red dust drifting in space, hard rim light` |
| `path_earth.png` | `Approaching a lush emerald and blue earth-like planet with white clouds and a thin glowing atmosphere` |
| `path_neptune.png` | `Approaching a deep cobalt blue ice giant with faint bands and a dark storm spot, cold light` |

Сохранять в `сайт2/assets/plates/`. Это обычные картинки — видео для этого не нужно.

### 0б. Проход мимо планет (сделано 27.09, из `plates/new/`)

Между мирами теперь три кадра: планета мира, который покидаем, проплывает мимо (`pass_*`) → подлёт к следующей (`path_*`) → мир. Открытый космос — `cruise_a` (после hero) и `cruise_b` (перед финалом). Уже стоят: `pass_venus` (кольца Сатурна, впереди Венера), `pass_mars`, `pass_earth` (позади Марс), `pass_neptune` (позади Земля), `pass_saturn` (позади Луна).

Не хватает двух кадров, которые точно совпадут по смыслу (сейчас на их местах временные):

| Файл | Промпт |
|---|---|
| `pass_saturn.png` | `The grey cratered Moon very large on the left, partly cut by the frame edge, falling behind; ahead on the right, smaller, Saturn with its golden rings tilted toward the viewer` |
| `pass_mars.png` | `A pearl-pink cloudy planet (Venus) large on the left, partly cut by the frame edge, falling behind; ahead on the right a rust-red planet (Mars) with copper canyons` |

К обоим — тот же общий хвост, что выше, и крупные тёмные астероиды на переднем плане. Лучше 2560–3840 px по ширине. После замены файла: `tools/depth.py pass-saturn` (или `pass-mars`), перемерить диски `tools/limbs.py` и поправить `ORBS` в `src/voyage.js`.

## 1. Фоны без банки (7 шт.) — желательно, но не обязательно

Зачем: если есть кадр мира с банкой (мастер) и тот же кадр без банки, я вырезаю банку пиксель-в-пиксель и она становится отдельным слоем. Тогда камера облетает банку, фон уходит назад, банка живёт своей жизнью, а при перелёте мир улетает, а банка — нет.

**Способ — не генерировать заново, а стереть банку в мастере** (иначе композиция не совпадёт):
Photoshop «Generative Fill» / «Remove tool», Krea / Leonardo «Inpaint», Midjourney «Vary (Region)», ChatGPT/Codex «edit image» — выделить банку с запасом ~5% по краям и её тень/отражение, в поле запроса:

| Файл результата | Мастер | Текст для заливки |
|---|---|---|
| `luna_plate.png` | `02_luna_3840x2160.png` | `icy black rocks and dark still water continuing naturally, cold fog, no objects` |
| `saturn_plate.png` | `03_saturn_3840x2160.png` | `dark asteroid rocks and golden dust continuing naturally, no objects` |
| `venus_plate.png` | `04_venus_3840x2160.png` | `flowing pink pearl liquid glass waves continuing naturally, no objects` |
| `mars_plate.png` | `05_mars_3840x2160.png` | `red rocky martian slope continuing naturally, dust, no objects` |
| `earth_plate.png` | `06_earth_3840x2160.png` | `wet mossy stones and flowing water continuing naturally, no objects` |
| `neptune_plate.png` | `07_neptune_3840x2160.png` | `deep blue liquid glass waves and wet rocks continuing naturally, no objects` |
| `final_plate.png` | `08_final_reveal_3840x2160.png` | стереть все шесть планет: `empty starry deep space above the planet horizon` |

Требования: размер 3840×2160 как у мастера, кадр **не сдвигать и не масштабировать**, всё кроме зоны банки должно остаться как было. Если инструмент уменьшает картинку — пришлите как есть, я подгоню.

## 2. Шесть планет отдельно — для финала и выбора мира (6 шт.)

Финал: камера отлетает, планеты появляются по очереди (STORYBOARD 07). Сейчас они запечены в один кадр.
Размер 2048×2048, **прозрачный фон** (или чистый чёрный — вырежу сам), свет слева-сверху, планета целиком в кадре с отступом 10%.

Общий хвост к каждому промпту:
`, single planet isolated in the center, full sphere visible, soft rim light from upper left, deep black background, photoreal NASA-style space photography, ultra detailed 8k, no stars, no text`

| Файл | Промпт (начало) |
|---|---|
| `planet_luna.png` | `a silver-grey moon with deep craters and cold blue rim light` |
| `planet_saturn.png` | `Saturn with wide golden champagne rings, rings tilted 20 degrees` |
| `planet_venus.png` | `a pearl-pink planet with soft swirling rose and cream clouds` |
| `planet_mars.png` | `a rust-red planet with copper canyons and dark basalt plains` |
| `planet_earth.png` | `an earth-like planet with emerald forests, blue oceans and white clouds` |
| `planet_neptune.png` | `a deep cobalt blue ice giant with faint bands and a dark storm spot` |

## 3. Банки — только настоящие

Этикетки генератор рисует с ошибками (в `11_catalog_lineup_alt` уже есть «хехестве сна», «Кватетивные»), поэтому банки **не генерировать**. Лучше всего: фото или 3D-рендер от бренда/дизайнера упаковки, фронт, 3840×2160, прозрачный фон, банка ≥ 1600 px по высоте. Сейчас в 4K есть только Mars и Venus, остальные четыре — 1680×945.
Если фоны из п.1 будут готовы — этот пункт не обязателен: банку я вырежу из мастера.

## Куда класть

`Сайт/сайт2/assets/plates/`, `Сайт/сайт2/assets/planets/`, `Сайт/сайт2/assets/packs/`, видео — `Сайт/сайт2/assets/video/`.
Как только файлы появятся — скажите, я встрою: фоны и планеты в объёмную версию, видео — вместо неё.
