# Physic_modeling_task

**Георгий Габатов, M3203** · преподаватель: Шоев И. В.

[![GitHub Pages](https://img.shields.io/badge/🌐_демо_онлайн-открыть-2563eb?style=for-the-badge)](https://iamirongik.github.io/Physic_modeling_task/)
[![Repo](https://img.shields.io/badge/GitHub-репозиторий-181717?style=for-the-badge&logo=github)](https://github.com/IAmironGik/Physic_modeling_task)

---

## 🌐 Онлайн-демо (GitHub Pages)

| Модуль | Задача | Демо | Отчёт PDF |
|--------|--------|------|-----------|
| **Магнитные колебания** | Связанные маятники | [**Открыть →**](https://iamirongik.github.io/Physic_modeling_task/01-magn-kolebaniya/) | [PDF](https://iamirongik.github.io/Physic_modeling_task/01-magn-kolebaniya/report.pdf) |
| **Оптика** | Интерференция N щелей | [**Открыть →**](https://iamirongik.github.io/Physic_modeling_task/02-optika/) | [PDF](https://iamirongik.github.io/Physic_modeling_task/02-optika/report.pdf) |

**Главная страница:** [iamirongik.github.io/Physic_modeling_task](https://iamirongik.github.io/Physic_modeling_task/)

---

## Структура проекта

```
Physic_modeling_task/
├── index.html              ← главная страница (GitHub Pages)
├── 01-magn-kolebaniya/     ← Задача 4: связанные маятники
└── 02-optika/              ← Задача 1: интерференция N щелей
```

## Локальный запуск

```bash
cd 01-magn-kolebaniya && python3 -m http.server 5173   # → localhost:5173
cd 02-optika && python3 -m http.server 8000            # → localhost:8000
```

## Тесты

```bash
cd 01-magn-kolebaniya && node --test
cd 02-optika && node --test
```

## Сборка отчётов (PDF)

```bash
brew install tectonic          # один раз, если ещё нет

cd 01-magn-kolebaniya && python3 generate_figures.py && tectonic report.tex
cd 02-optika && python3 generate_figures.py && tectonic report.tex
```

## GitHub Pages — первый запуск

**1. Включи Pages (один раз):**

Settings → **Pages** → **Build and deployment** → **Source: Deploy from a branch**

- Branch: **`gh-pages`**
- Folder: **`/ (root)`**
- Save

**2. Запуш в `main`** — workflow создаст ветку `gh-pages` и зальёт туда сайт.

Или вручную: **Actions → Deploy GitHub Pages → Run workflow**

Сайт: **https://iamirongik.github.io/Physic_modeling_task/**

## Что внутри каждого модуля

| Файл / папка | Назначение |
|--------------|------------|
| `index.html` | Интерактивное демо |
| `src/` | Код программы |
| `tests/` | Автотесты |
| `figures/` | Картинки для отчёта |
| `report.tex` / `report.pdf` | Отчёт |
| `generate_figures.py` | Пересборка рисунков |
