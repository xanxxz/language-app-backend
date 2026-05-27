# Language App Backend

Backend API для приложения изучения языков.

Создано на:

* Node.js
* Express
* TypeScript
* PostgreSQL
* JWT Authentication

---

# Используемые технологии

* Express 5
* PostgreSQL
* JWT
* bcrypt
* TypeScript
* ts-node-dev

---

# Установка

Установить зависимости:

```bash
npm install
```

---

# Настройка ENV

Создайте файл `.env` в корне проекта:

```env
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

JWT_SECRET=your_secret_key
```

---

# Запуск в режиме разработки

```bash
npm run dev
```

Сервер будет доступен по адресу:

```txt
http://localhost:3000
```

---

# Seed базы данных

Запуск заполнения базы начальными данными:

```bash
npm run seed
```

---

# Production запуск

Рекомендуется добавить production scripts в `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "ts-node src/seedLearn.ts"
  }
}
```

---

# Сборка проекта

```bash
npm run build
```

После сборки JavaScript файлы появятся в:

```txt
dist/
```

---

# Production запуск

```bash
npm run start
```

---

# Деплой на Railway

## Build Command

```bash
npm install && npm run build
```

## Start Command

```bash
npm run start
```

---

# Переменные окружения Railway

Добавьте в Variables:

```env
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

JWT_SECRET=your_secret_key
```

---

# PostgreSQL

Можно использовать:

* Railway PostgreSQL
* Supabase
* Neon
* Render PostgreSQL

---

# Важно для Railway

Сервер должен слушать:

```ts
process.env.PORT
```

Пример:

```ts
app.listen(process.env.PORT || 3000)
```

---

# Структура проекта

```txt
src/
 ├── routes/
 ├── controllers/
 ├── middleware/
 ├── services/
 ├── seedLearn.ts
 └── index.ts
```

---

# API

Пример базового URL:

```txt
https://your-app.up.railway.app
```

---

# Лицензия

ISC
