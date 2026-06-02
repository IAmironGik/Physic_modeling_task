# Physic_modeling_task

**Георгий Габатов, M3203** · преподаватель: Шоев И. В.

Репозиторий: [github.com/IAmironGik/Physic_modeling_task](https://github.com/IAmironGik/Physic_modeling_task)

Два модуля вычислительного практикума — **по одной задаче** в каждом.

```
Physic_modeling_task/
├── 01-magn-kolebaniya/     ← Задача 4: связанные маятники
└── 02-optika/              ← Задача 1: интерференция N щелей
```

## Запуск демо

```bash
cd 01-magn-kolebaniya && python3 -m http.server 5173   # → localhost:5173
cd 02-optika && python3 -m http.server 8000            # → localhost:8000
```

## Тесты

```bash
cd 01-magn-kolebaniya && node --test
cd 02-optika && node --test
```

## Отчёты (PDF)

```bash
brew install tectonic          # один раз, если ещё нет

cd 01-magn-kolebaniya && python3 generate_figures.py && tectonic report.tex
cd 02-optika && python3 generate_figures.py && tectonic report.tex
```

Готовые файлы: `01-magn-kolebaniya/report.pdf`, `02-optika/report.pdf`.

## Что внутри каждого модуля

| Файл / папка | Назначение |
|--------------|------------|
| `index.html` | Открыть в браузере |
| `src/` | Код программы |
| `tests/` | Автотесты |
| `figures/` | Картинки для отчёта |
| `report.tex` | Отчёт → PDF |
| `generate_figures.py` | Пересборка рисунков |
