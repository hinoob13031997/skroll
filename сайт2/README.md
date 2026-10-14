# Moonvit Universe — Production Package

Это единый пакет материалов для реализации утверждённой версии сайта Moonvit: cinematic luxury / space wellness universe.

## Что внутри

- `assets/main/` — основные PNG-фрагменты утверждённого макета.
- `assets/storyboard/` — отдельные кадры production-storyboard и переходов.
- `assets/references/` — master-концепт и master-storyboard.
- `data/products.json` — вся продуктовая структура и marketplace URL.
- `data/products.csv` — компактная таблица для CMS/import.
- `docs/CONTENT_MASTER.md` — готовая контентная архитектура сайта.
- `docs/STORYBOARD.md` — сценарий движения камеры и переходов.
- `docs/IMPLEMENTATION_SPEC.md` — техническое ТЗ разработчику.
- `docs/DESIGN_SYSTEM.md` — визуальная система.
- `docs/SITEMAP.md` — маршруты и страницы.
- `docs/MARKETPLACE_LINKS.md` — Ozon/Wildberries по каждому продукту.
- `docs/CONTENT_QA.md` — обязательные проверки перед запуском.
- `docs/SOURCES.md` — откуда перенесены данные.

## Принцип проекта

Главная — это не лендинг из секций, а один непрерывный scroll-film:
Hero → Luna → Saturn → Venus → Mars → Earth → Neptune → финальный reveal системы.

После cinematic-части начинается e-commerce: выбор состояния, карточки продуктов, состав, способ приёма, отзывы, Ozon/Wildberries и официальный checkout.

## Важно

PNG из утверждённого концепта содержат местами запечённый интерфейс/текст. Для production-анимации лучше использовать их как art-direction/reference и подготовить чистые слои: background / planet / foreground / fog / light / product отдельно.
