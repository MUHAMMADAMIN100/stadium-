# 🏟️ Stadium Booking

Сайт для онлайн-бронирования стадиона. Клиенты видят расписание на сегодня и неделю, могут забронировать свободный час и отменить свою бронь по коду. Владелец получает уведомления в Telegram на каждое бронирование и отмену.

## Стек
- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **Деплой:** Railway (backend + БД) + Vercel (frontend)

## Структура

```
st/
├── backend/     # NestJS API
└── frontend/    # React SPA
```

---

## Локальный запуск

### 1. Backend

```bash
cd backend
cp .env.example .env
# отредактируй .env — укажи DATABASE_URL (PostgreSQL)
npm install
npx prisma migrate dev --name init
npm run start:dev
```

Backend поднимется на `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend на `http://localhost:5173`.

---

## Переменные окружения

### backend/.env

| Имя | Описание |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | порт (по умолчанию `3000`) |
| `CORS_ORIGIN` | адреса фронтенда через запятую (напр. `https://mysite.vercel.app,http://localhost:5173`) |
| `TELEGRAM_BOT_TOKEN` | токен бота от @BotFather (можно оставить пустым — уведомления просто не будут отправляться) |
| `TELEGRAM_CHAT_ID` | chat_id владельца (получить через @userinfobot) |

### frontend/.env

| Имя | Описание |
|---|---|
| `VITE_API_URL` | адрес backend, напр. `https://stadium-api.up.railway.app` |

---

## Деплой

### Backend на Railway

1. Создай новый проект на [Railway](https://railway.app)
2. Добавь **PostgreSQL** из templates
3. Добавь сервис из GitHub → укажи папку `backend`
4. В **Variables** укажи:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `CORS_ORIGIN` = `https://<твой-фронт>.vercel.app`
   - `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (опционально)
5. Railway сам запустит `npm install` → `prisma generate` → `npm run build`, затем `start` из `railway.json` (`prisma migrate deploy && node dist/main.js`)
6. Скопируй публичный URL сервиса.

### Frontend на Vercel

1. Импортируй репозиторий в [Vercel](https://vercel.com), укажи корневой каталог `frontend`.
2. Framework: **Vite**. Vercel сам определит `npm run build` и папку `dist`.
3. В **Environment Variables** добавь:
   - `VITE_API_URL` = URL с Railway (из предыдущего шага)
4. Задеплой. SPA-routing уже настроен через `vercel.json`.
5. Добавь URL Vercel в `CORS_ORIGIN` на Railway и передеплой backend.

---

## Telegram-бот

1. Напиши [@BotFather](https://t.me/BotFather) → `/newbot` → получи **BOT_TOKEN**
2. Напиши своему боту любое сообщение
3. Узнай свой **chat_id** через [@userinfobot](https://t.me/userinfobot)
4. Добавь оба значения в переменные окружения на Railway

---

## API

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/bookings/today` | брони на сегодня |
| `GET` | `/bookings/week` | брони на 7 дней вперёд |
| `GET` | `/bookings/range?from=ISO&to=ISO` | брони за диапазон |
| `POST` | `/bookings` | создать бронь `{customerName, phone, startAt}` → вернёт `cancelCode` |
| `POST` | `/bookings/cancel` | отменить `{cancelCode, phone}` |

Все времена в **UTC (ISO 8601)**.

---

## Что можно доработать
- Авторизация владельца (админка)
- Несколько стадионов
- Онлайн-оплата
- Email/SMS-уведомления клиенту
