# ИС ИКД — веб-интерфейс и API

Информационная система поддержки проектов по разработке инженерно-конструкторской документации.

## Сайт для проверки (GitHub Pages)

**https://nekit66.github.io/web-interface/**

Демо-вход (пароль `123`):

| Логин | Роль |
|-------|------|
| `chief_engineer` | Главный инженер |
| `tech_dept_head` | Начальник технического отдела |
| `project_chief1` | ГИП |
| `designer_ivanov` | Инженер-проектировщик |

> Сайт на GitHub Pages — это фронтенд. Данные и авторизация идут через API на Render. При первом открытии подождите до 1–2 минут (бесплатный сервер «просыпается»).

## Один раз: включить GitHub Pages

1. Репозиторий → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions** (не «Deploy from branch»)
3. После push в `main` сайт обновится автоматически

## Один раз: запустить API (Render, бесплатно)

1. [render.com](https://render.com) → регистрация → **New** → **Blueprint** (или Web Service)
2. Подключить репозиторий `Nekit66/web-interface`
3. Render подхватит `render.yaml` (папка `server`, сервис `is-ikd-api`)
4. Дождаться статуса **Live** — URL: `https://is-ikd-api.onrender.com`

Фронтенд уже настроен на этот адрес API.

## Локальный запуск

```bash
cd server
npm install
npm start
```

Откройте: **http://localhost:3000/index.html**

## Структура

```
project/     — фронтенд (деплой на GitHub Pages)
server/      — Express API + SQLite
```
