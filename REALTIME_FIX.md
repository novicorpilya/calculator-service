# 🔧 Исправление Realtime ошибки

## ⚠️ Проблема

Вы видите ошибку в консоли:
```
[Sync:Error] Realtime subscription failed. ACTION REQUIRED:
1. Ensure "calculations" table is added to "supabase_realtime" publication.
2. Run "scripts/fix-realtime-sync.sql" in Supabase SQL Editor.
```

## ✅ Решение

### Шаг 1: Откройте Supabase SQL Editor

1. Перейдите на https://app.supabase.com
2. Выберите ваш проект
3. Откройте **SQL Editor** (слева в меню)

### Шаг 2: Выполните SQL скрипт

**Вариант A: Полное исправление (рекомендуется)**

Скопируйте и выполните весь скрипт из файла:
```
scripts/fix-realtime-complete.sql
```

Этот скрипт:
- ✅ Включает Realtime для `messages` таблицы
- ✅ Включает Realtime для `calculations` таблицы
- ✅ Настраивает RLS политики
- ✅ Устанавливает REPLICA IDENTITY
- ✅ Проверяет настройки

**Вариант B: Быстрое исправление**

Если нужно быстро, выполните только это:

```sql
-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
GRANT SELECT ON public.messages TO authenticated;

-- Enable Realtime for calculations
ALTER PUBLICATION supabase_realtime ADD TABLE calculations;
ALTER TABLE public.calculations REPLICA IDENTITY FULL;
GRANT SELECT ON public.calculations TO authenticated;
```

### Шаг 3: Перезапустите приложение

```bash
# Остановите dev сервер (Ctrl+C)
# Запустите снова
npm run dev
```

### Шаг 4: Проверка

После перезапуска ошибка должна исчезнуть. Проверьте консоль браузера.

---

## 🔍 Что это исправляет?

### До исправления:
- ❌ Сообщения не обновляются в real-time
- ❌ Изменения статусов не синхронизируются
- ❌ Ошибки в консоли

### После исправления:
- ✅ Мгновенное обновление сообщений
- ✅ Real-time синхронизация статусов
- ✅ Нет ошибок в консоли

---

## 📋 Дополнительная информация

### Что такое Realtime Publication?

Supabase Realtime использует PostgreSQL публикации для отслеживания изменений в таблицах. Если таблица не добавлена в публикацию `supabase_realtime`, изменения не будут транслироваться.

### Что такое REPLICA IDENTITY?

`REPLICA IDENTITY FULL` указывает PostgreSQL отправлять все значения колонок при изменениях, что необходимо для корректной работы Realtime.

### Безопасность

RLS (Row Level Security) политики гарантируют, что пользователи видят только те данные, к которым у них есть доступ, даже через Realtime подписки.

---

## 🆘 Если не помогло

1. **Проверьте выполнение скрипта**
   - Убедитесь, что скрипт выполнился без ошибок
   - Проверьте вывод в SQL Editor

2. **Проверьте настройки проекта**
   ```sql
   -- Проверьте, какие таблицы в публикации
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime';
   ```

3. **Перезапустите Supabase проект**
   - Project Settings → General → Pause project
   - Подождите 30 секунд
   - Resume project

4. **Очистите кэш браузера**
   - Ctrl+Shift+Delete
   - Очистите кэш и cookies
   - Перезагрузите страницу

---

## 📚 Полезные ссылки

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Publications](https://www.postgresql.org/docs/current/sql-createpublication.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Статус**: Готово к исправлению  
**Время**: ~2 минуты  
**Сложность**: Легко
