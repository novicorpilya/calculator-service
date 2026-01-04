# 🎯 HICS — Professional Inventory Management System

![Version](https://img.shields.io/badge/version-2.1.0-blue?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20TypeScript-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**HICS (HoReCa Inventory Calculation System)** — профессиональная система для расчета и управления закупками инвентаря в секторе HoReCa с интеллектуальным движком расчетов, real-time коммуникацией и голосовыми сообщениями.

---

## ✨ Основные возможности

### 🧮 Интеллектуальный расчет (Engine v2.0)
- Автоматический расчет норм на основе площади, персонала и интенсивности
- Учет HACCP-стандартов и цветового кодирования
- Коэффициенты циклов замены и санитарных уровней
- Экспорт спецификаций в Excel

### 💬 Real-time коммуникация
- Мгновенный чат между клиентом и менеджером
- **Голосовые сообщения** (как в Telegram)
- Отправка изображений и файлов
- Автоматическая синхронизация через Supabase Realtime

### 👥 Ролевая система
- **Client**: Создание проектов, чат с экспертом
- **Manager**: Аудит заявок, выставление счетов
- **Admin**: Управление каталогом и пользователями

### 📊 Управление проектами
- Полный жизненный цикл от черновика до завершения
- Система статусов с визуальными индикаторами
- История изменений и обсуждений
- Реквизиты для оплаты

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+ 
- npm или yarn
- Аккаунт Supabase

### 1. Клонирование репозитория
```bash
git clone https://github.com/your-username/calculator-service.git
cd calculator-service
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env и добавьте ваши ключи Supabase
```

### 4. Настройка базы данных
Выполните SQL-скрипты в Supabase SQL Editor:
```sql
-- 1. Основная схема (если еще не создана)
-- 2. scripts/add-voice-messages.sql
-- 3. scripts/purge-legacy-statuses.sql (опционально)
```

### 5. Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

### 6. Сборка для продакшена
```bash
npm run build
```

---

## 🛠 Технологический стек

### Frontend
- **React 18** + **Vite** - быстрая разработка и сборка
- **TypeScript** - строгая типизация
- **Tailwind CSS** - современный дизайн
- **Lucide Icons** - иконки

### Backend & Services
- **Supabase** - база данных, аутентификация, real-time
- **PostgreSQL** - надежное хранилище данных
- **Row Level Security** - безопасность на уровне БД

### Дополнительно
- **XLSX** - экспорт в Excel
- **Sonner** - уведомления
- **MediaRecorder API** - голосовые сообщения

---

## 📁 Структура проекта

```
calculator-service/
├── src/
│   ├── app/                    # Роутинг и конфигурация
│   ├── components/             # Переиспользуемые компоненты
│   │   └── ui/                 # VoiceRecorder, VoicePlayer
│   ├── features/               # Основные фичи
│   │   ├── auth/               # Аутентификация
│   │   └── dashboard/          # Дашборд (client/manager/admin)
│   ├── pages/                  # Страницы приложения
│   ├── services/               # API сервисы
│   └── utils/                  # Утилиты
├── scripts/                    # SQL миграции
├── public/                     # Статические файлы
└── dist/                       # Сборка (не в Git)
```

---

## 🔐 Безопасность

### Переменные окружения
**НИКОГДА** не коммитьте файл `.env` в Git!

Используйте `.env.example` как шаблон:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Row Level Security (RLS)
Все таблицы защищены RLS политиками:
- Пользователи видят только свои данные
- Менеджеры имеют доступ к назначенным проектам
- Админы имеют полный доступ

### Аутентификация
- JWT токены через Supabase Auth
- Защищенные роуты
- Проверка ролей на клиенте и сервере

---

## 📱 Совместимость

### Браузеры
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ⚠️ Safari 14+ (голосовые сообщения могут требовать разрешений)

### Устройства
- ✅ Desktop (1920x1080+)
- ✅ Tablet (768px+)
- ✅ Mobile (375px+)

---

## 🚀 Деплой

### Vercel (рекомендуется)
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

### Настройка переменных окружения
Не забудьте добавить переменные окружения в настройках хостинга!

---

## 📚 Документация

- [Быстрый старт](./DEPLOY.md) - инструкция по деплою
- [Безопасность Git](./GIT_SECURITY.md) - работа с секретами
- [Голосовые сообщения](./VOICE_MESSAGES_README.md) - настройка аудио
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - чеклист перед релизом
- [Production Audit](./PRODUCTION_AUDIT.md) - полный аудит кода

---

## 🧪 Тестирование

### Запуск линтера
```bash
npm run lint
```

### Проверка типов
```bash
npm run type-check
```

### Сборка
```bash
npm run build
```

---

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📝 Лицензия

Проект разработан для коммерческого использования.

---

## 👨‍💻 Автор

**Developed by Antigravity Studio**  
📧 Email: support@example.com  
🌐 Website: https://example.com

---

## 🙏 Благодарности

- [Supabase](https://supabase.com/) - за отличный BaaS
- [Vite](https://vitejs.dev/) - за быструю сборку
- [Tailwind CSS](https://tailwindcss.com/) - за удобный CSS

---

**⭐ Если проект был полезен, поставьте звезду!**
