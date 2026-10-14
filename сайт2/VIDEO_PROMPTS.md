# VIDEO PROMPTS — настоящие кадры для фильма на главной

> НЕОБЯЗАТЕЛЬНО. Полёт по вселенной строится из картинок (IMAGE_PROMPTS.md, раздел 0 «Кадры пути»). Видео — следующий уровень качества, если захочется ещё больше живости.

Почему: сейчас главная — это 8 статичных картинок, которые код приближает, покачивает и раскрывает кругом. Как ни крути шейдеры, глаз видит слайд-шоу. Эффект фильма дают только настоящие движущиеся кадры: камера реально летит, кольца вращаются, вода течёт, пыль летит, параллакс настоящий. Их делает image-to-video генератор из уже готовых 4K-мастеров.

## Чем генерировать

Нужен генератор с режимом **First frame + Last frame** (начальный и конечный кадр):
Kling 2.x (Start/End frame), Google Veo 3 (first/last frame), Runway Gen-4 / Gen-4 Turbo (keyframes), Luma Ray 2 (keyframes), Higgsfield, MiniMax Hailuo 02.

## Общие настройки для всех клипов

- Разрешение: 1920×1080 минимум (лучше 2560×1440 / 4K, если есть), 16:9, 24 или 30 fps.
- Длительность: переходы 5 с, петли миров 8–10 с.
- Режим качества: максимальный (Professional / High quality). Без звука.
- Negative prompt (если поле есть): `text, letters, subtitles, watermark, logo change, label distortion, morphing jar, people, hands, cartoon, CGI look, low detail, flicker, camera shake`
- Банки: этикетки у генераторов «плывут». Поэтому в петлях миров камера почти стоит, а банка неподвижна. Если этикетка всё равно поплыла, клип всё равно присылайте: поверх банки я наложу оригинальный кадр из мастера (он точный пиксель-в-пиксель).
- Сгенерируйте по 2–3 варианта каждого клипа и выберите лучший. Главные критерии: нет морфинга и нет рывков в начале и в конце.

Кадры (First/Last frame) — мастера из корня проекта `Сайт/`:
`01_hero_3840x2160.png`, `02_luna…`, `03_saturn…`, `04_venus…`, `05_mars…`, `06_earth…`, `07_neptune…`, `08_final_reveal_3840x2160.png`.

---

## A. Петли миров (8 шт.) — «живой кадр», пока посетитель читает текст

First frame = Last frame = один и тот же мастер, чтобы петля была бесшовной.
Если генератор не принимает одинаковые кадры, задайте только First frame: склейку «туда-обратно» я сделаю сам.

| Файл | Кадр | Prompt |
|---|---|---|
| `hero-loop.mp4` | 01_hero | Cinematic slow dolly-in toward a colossal dark planet, the star rising behind its rim, lens flare slowly breathing, thin mist drifting over black water, gentle ripples with reflections of starlight, distant stars twinkling. Photoreal, IMAX space cinematography, deep blacks, very slow and smooth camera. |
| `luna-loop.mp4` | 02_luna | Almost static camera with a very slow push-in. Cold fog rolls low between icy black rocks, black water gently moves and reflects the silver moon, a few tiny ice particles float in the air. The jar stands perfectly still and unchanged. Photoreal, calm, moody, slow motion. |
| `saturn-loop.mp4` | 03_saturn | Slow orbital camera drift to the right. Saturn's golden rings flow and shimmer, asteroids in the foreground and background slowly tumble and drift, fine golden dust sparkles in warm champagne light. The jar stands perfectly still and unchanged. Photoreal, epic, cinematic. |
| `venus-loop.mp4` | 04_venus | Soft breathing push-in. Liquid pearl and pink glass waves slowly flow and swirl around the base of the jar, iridescent highlights glide across the liquid, the pink planet glows softly in haze. The jar stands perfectly still and unchanged. Photoreal, luxurious, slow motion. |
| `mars-loop.mp4` | 05_mars | Low slow tracking shot across the red rocky slope. Red dust drifts in the wind, heat haze shimmers above the stones, small rocks float slowly in the sky, Mars glows huge behind. The jar stands perfectly still and unchanged. Photoreal, dramatic rim light, cinematic. |
| `earth-loop.mp4` | 06_earth | Nearly static camera, gentle push-in. The waterfall flows naturally, spray and mist rise, water runs over wet mossy stones, droplets sparkle in a single beam of light. The jar stands perfectly still and unchanged. Photoreal nature cinematography. |
| `neptune-loop.mp4` | 07_neptune | Very smooth slow push-in. Deep cobalt waves of liquid glass roll and refract light, caustics dance across the rocks, a few bubbles rise, Neptune glows above. The jar stands perfectly still and unchanged. Photoreal, underwater-like calm, slow motion. |
| `final-loop.mp4` | 08_final_reveal | Slow majestic dolly-out. The six planets hang in a row above the planet's horizon, the star glows at the center, atmosphere of the horizon shimmers, stars twinkle. Photoreal, epic finale, very slow camera. |

---

## B. Перелёты между мирами (7 шт.) — главное, что создаёт фильм

First frame = мастер мира «откуда», Last frame = мастер мира «куда». Идея переходов — из STORYBOARD.md.

| Файл | First → Last | Prompt |
|---|---|---|
| `fly-hero-luna.mp4` | 01_hero → 02_luna | One continuous shot: the camera glides along the dark edge of the giant planet past the rising star, descends through thin cold mist and lands low above black water among icy rocks, where a jar is revealed through the fog under a silver moon. Smooth fast flight, photoreal, no cuts. |
| `fly-luna-saturn.mp4` | 02_luna → 03_saturn | One continuous shot: a thin golden line appears in the reflection on the black water, the camera dives into it, the line grows into Saturn's glowing golden rings, the camera flies along the rings through tumbling asteroids and arrives at a jar among the rocks. Photoreal, no cuts. |
| `fly-saturn-venus.mp4` | 03_saturn → 04_venus | One continuous shot: a golden ring passes right in front of the lens, its light blooms and dissolves into soft pearl light, which becomes flowing pink liquid glass surrounding a jar under a pink planet. Photoreal, dreamy, no cuts. |
| `fly-venus-mars.mp4` | 04_venus → 05_mars | One continuous shot: a warm pearl glare sweeps across the frame and turns into swirling red dust, the camera flies low and fast over a heavy rocky Martian slope and slows down at a jar in rim light under a huge Mars. Photoreal, no cuts. |
| `fly-mars-earth.mp4` | 05_mars → 06_earth | One continuous shot: dry red dust thickens, then turns into wet white mist, the camera comes out of the mist very close to wet mossy stone and pulls back to reveal a waterfall and a jar standing on the stones. Photoreal, no cuts. |
| `fly-earth-neptune.mp4` | 06_earth → 07_neptune | One continuous shot: the camera descends to the water surface and passes through it; underwater light, bubbles and refraction turn deep cobalt blue, and the camera emerges among waves of liquid glass where a jar stands sharp under Neptune. Photoreal, no cuts. |
| `fly-neptune-final.mp4` | 07_neptune → 08_final_reveal | One continuous shot: a blue lens of light expands, the camera starts a huge dolly-out into space, and the six planets appear one after another above the horizon of a planet — Neptune, Earth, Mars, Venus, Saturn, Luna. Epic, photoreal, no cuts. |

---

## Куда класть

`Сайт/сайт2/assets/video/` — с именами из таблиц. Формат любой (MP4/MOV), перекодирование в all-intra для прокрутки скроллом, сжатие и мобильные версии делаю сам.

## Как это будет работать на сайте

Скролл = таймлайн фильма: `hero-loop` → `fly-hero-luna` → `luna-loop` → `fly-luna-saturn` → … → `final-loop`.
Во время перелёта скролл проматывает видео вперёд и назад кадр за кадром. Когда посетитель остановился на мире, играет его живая петля и появляется текст.
Поверх видео — частицы мира, зерно, свет по банке и подпись. Текст остаётся HTML для SEO.
