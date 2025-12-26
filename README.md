# 🧮 Calculator Service - HoReCa Authentication System

Современное веб-приложение для гостинично-ресторанного сектора с системой аутентификации и авторизации на базе Supabase.

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
3. Включите email confirmation в Authentication → Settings

### Запуск проекта
```bash
npm run dev
```

## 📋 Основной функционал

- ✅ Регистрация пользователей с валидацией
- ✅ Вход в систему с функцией "Запомнить меня"
- ✅ Клиентская валидация форм (onBlur, real-time)
- ✅ Управление сессиями через Supabase
- ✅ Безопасное хранение данных

## 🛠️ Технологии

- **React 19** + **TypeScript**
- **Vite** - сборщик
- **Tailwind CSS** - стилизация
- **Supabase** - Backend (Auth + Database)
- **Axios** - HTTP клиент

## 📁 Структура проекта

```
src/
├── app/              # Провайдеры и инициализация
├── features/         # Бизнес-логика (auth, calculator)
├── components/       # UI компоненты
├── hooks/            # Кастомные хуки
├── services/         # Внешние сервисы
└── pages/            # Страницы приложения
```

## 🔐 Безопасность

- Пароли хешируются на стороне Supabase
- JWT токены с автоматическим обновлением
- RLS (Row Level Security) политики
- Валидация всех входных данных
- Защита от XSS, CSRF, SQL injection

## 📚 Документация

- [Подробное описание проекта](./PROJECT_DESCRIPTION.md)
- [Чеклист безопасности](./SECURITY_CHECKLIST.md)

## 🎯 Готовность к production

**Текущий статус**: ⚠️ 85% готовности

**Требуется**:
1. Применить SQL скрипт с RLS политиками
2. Настроить email confirmation в Supabase
3. Настроить CORS для production домена

## 📝 Лицензия

MIT
