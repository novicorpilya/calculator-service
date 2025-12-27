# 🧮 Calculator Service - HoReCa Authentication System

Современное веб-приложение для гостинично-ресторанного сектора с системой аутентификации на базе Supabase.

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Настройка переменных окружения
Создайте файл `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Настройка базы данных
1. Откройте Supabase Dashboard → SQL Editor
2. Выполните скрипт `scripts/setup-supabase-production.sql`
3. Включите email confirmation в Authentication → Settings (опционально)

### Запуск проекта
```bash
npm run dev
```

## 📋 Основной функционал

- ✅ Регистрация пользователей с валидацией полей
- ✅ Вход в систему с поддержкой постоянных и сессионных токенов
- ✅ Умная функция "Запомнить меня" (переключение между localStorage и sessionStorage)
- ✅ Защищенный доступ к Dashboard
- ✅ Локализация ошибок сервера на русский язык
- ✅ Безопасный ввод телефона (фильтрация символов)

## 🛠️ Технологии

- **React 19** + **TypeScript**
- **Vite** - сборщик
- **Tailwind CSS** - стилизация
- **Supabase** - Backend (Auth + Database + RLS)
- **Lucide React** - иконки

## 📁 Структура проекта

```
src/
├── app/              # Контексты и провайдеры приложения
├── components/       # UI компоненты (auth, layout, ui)
├── features/         # Бизнес-логика (auth)
├── hooks/            # Кастомные хуки (useAuthForm)
├── services/         # Сервисы (Supabase, Auth)
├── pages/            # Страницы приложения (Dashboard)
├── utils/            # Утилиты и переводы
└── styles/           # Глобальные стили
```

## 🔐 Безопасность

- **JWT Auth**: Автоматическое управление токенами через Supabase
- **Hybrid Storage**: Динамический выбор типа хранилища (Session vs Local) для защиты от утечек на публичных устройствах.
- **RLS**: Row Level Security для защиты данных на уровне БД.
- **Validation**: Строгая клиентская валидация и фильтрация ввода.

## 📝 Лицензия

MIT
