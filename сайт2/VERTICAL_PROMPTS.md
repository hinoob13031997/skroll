# Вертикальные сцены миров — для главной на телефоне

Зачем: на главной миры стоят на изогнутой стене. На компьютере кадры горизонтальные (16:9) и смотрятся полностью. На телефоне стена вертикальная, и из горизонтального кадра остаётся узкая полоса вокруг банки: пропадают скалы, вода, кольца Сатурна. Нужны те же шесть сцен в формате **9:16 (вертикально)**.

Главное правило: **банку не генерировать заново.** Нейросеть искажает этикетку и надписи. Поэтому ниже два способа, оба сохраняют настоящую банку.

---

## Способ А (рекомендую): достроить кадр вверх и вниз

Я уже вырезал из 4K-мастеров квадраты 2160×2160 с банкой в центре:
`сайт2/assets/vertical/{luna,saturn,venus,mars,earth,neptune}_square_2160.png`

Нужно **достроить каждый квадрат сверху и снизу** до вертикального кадра **2160×3840** (9:16), не трогая середину.

Где:
- **Photoshop:** Crop Tool → растянуть холст вверх и вниз до 9:16 → *Generative Expand*. Лучший вариант.
- **Midjourney:** загрузить картинку → *Pan ⬆* и *Pan ⬇* (или Editor → расширить холст).
- **Krea / Leonardo:** Canvas / Outpaint, холст 9:16, квадрат по центру.
- ChatGPT подходит хуже: может перерисовать банку. Если пользоваться им, проверьте этикетку.

Текст для заполнения (вставлять в поле подсказки при расширении):

| Файл результата | Подсказка |
|---|---|
| `luna_9x16.png` | `continue the scene upward and downward: above — deep night sky with the Milky Way and the huge silver cratered moon, cold blue light; below — black icy rocks and dark still water with soft reflections and low fog; same light, same style, photoreal` |
| `saturn_9x16.png` | `continue the scene upward and downward: above — dark space with golden dust and Saturn's glowing rings arcing across the sky; below — dark jagged asteroid rocks lit by warm golden rim light, floating small rocks; same light, same style, photoreal` |
| `venus_9x16.png` | `continue the scene upward and downward: above — soft rose and pearl sky with the pink cloudy planet and a small moon; below — flowing pink pearl liquid glass waves with glossy highlights; same light, same style, photoreal` |
| `mars_9x16.png` | `continue the scene upward and downward: above — dusty red sky with the huge rust-red planet and its canyons; below — red rocky martian slope with scattered stones and drifting dust; same light, same style, photoreal` |
| `earth_9x16.png` | `continue the scene upward and downward: above — the blue-green planet with white clouds and a thin glowing atmosphere, starry sky; below — wet mossy stones, a small waterfall and clear flowing water; same light, same style, photoreal` |
| `neptune_9x16.png` | `continue the scene upward and downward: above — deep cobalt space with the blue ice giant and its dark storm, cold light; below — deep blue liquid glass waves and wet dark rocks with droplets; same light, same style, photoreal` |

Для всех: **без текста, без логотипов, без людей, без второй банки.** Середина (банка и то, что вокруг неё) должна остаться пиксель-в-пиксель.

---

## Способ Б: новая сцена без банки (если А не выходит)

Сгенерировать сцену целиком, **9:16, 2160×3840**, с пустым плоским камнем в центре, куда я сам поставлю настоящую банку со светом и отражением.

Общий хвост к каждому промпту:
`, vertical 9:16 composition, in the center of the lower half an empty flat-topped rock as a natural pedestal (nothing on it), the camera at pedestal height, cinematic photoreal product-advertising scene, dramatic rim light, shallow depth of field, IMAX quality, no text, no logos, no people, no products`

| Файл | Начало промпта |
|---|---|
| `luna_9x16_empty.png` | `Night on an icy shore: black wet rocks and dark still water with low fog, a huge silver cratered moon and the Milky Way above, cold blue moonlight` |
| `saturn_9x16_empty.png` | `A dark asteroid field glowing with golden dust, Saturn and its wide champagne rings arcing through the sky, warm golden rim light on jagged rocks` |
| `venus_9x16_empty.png` | `A dreamy world of flowing pink pearl liquid glass waves, a rose cloudy planet and a small moon in a soft pearl sky, gentle glossy light` |
| `mars_9x16_empty.png` | `A red rocky martian slope with drifting dust, a huge rust-red planet with copper canyons filling the sky, hard warm rim light` |
| `earth_9x16_empty.png` | `Wet mossy stones by a small waterfall with clear flowing water, the blue-green earth with white clouds and a glowing atmosphere in a starry sky, fresh natural light` |
| `neptune_9x16_empty.png` | `Deep blue liquid glass waves and wet dark rocks with droplets, a cobalt ice giant with a dark storm spot in the sky, cold blue light` |

---

## Куда класть

В `сайт2/assets/vertical/`. Названия как в таблицах. Если сервис уменьшил картинку, присылайте как есть, я подгоню. После этого я подключу их к мобильной версии стены (и, если сделан способ Б, поставлю в них настоящие банки).
