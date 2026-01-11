# 📸 Логика отправки сообщений с изображениями

## Текущая реализация (после удаления loader)

### 🔄 Полный цикл отправки изображения:

---

## 1️⃣ **Пользователь выбирает изображение**

```tsx
// Файл выбран через input
handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    // Создаем blob URL для preview
    const newAttachments = files.map(file => ({
        file: file,
        preview: URL.createObjectURL(file), // blob:http://localhost:5173/abc-123
        isUploading: false
    }));
    
    setPendingAttachments(prev => [...prev, ...newAttachments]);
}
```

**Результат:**
- ✅ Изображение показывается в preview (внизу чата)
- ✅ Создан blob URL для локального просмотра

---

## 2️⃣ **Пользователь нажимает "Отправить"**

```tsx
handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    const attachments = [...pendingAttachments];
    
    // Очищаем UI сразу
    setNewMessage('');
    setPendingAttachments([]);
    
    // Создаем optimistic сообщения
    const optimisticMsgs: Message[] = [];
    
    for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        const tempId = `temp-${Date.now()}-${i}`;
        
        // Создаем временное сообщение
        optimisticMsgs.push({
            id: tempId,              // ← temp- ID
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: i === 0 ? text : '',
            image_url: att.preview,  // ← blob URL
            created_at: timestamp,
        });
    }
    
    // Добавляем в список СРАЗУ
    setMessages(prev => [...prev, ...optimisticMsgs]);
}
```

**Результат:**
- ✅ Input очищен
- ✅ Preview очищен
- ✅ Сообщение появилось в чате с blob URL
- ✅ Изображение **размыто** (`blur-[2px] opacity-70`)

---

## 3️⃣ **Загрузка на сервер (параллельно)**

```tsx
// В фоне выполняется:
try {
    for (const att of attachments) {
        // 1. Upload файла в Supabase Storage
        const imageUrl = await chatService.uploadAttachment(att.file);
        // Результат: https://supabase.co/storage/v1/object/public/attachments/chat/abc-123.jpg
        
        // 2. Создание записи в БД
        await chatService.sendMessage({
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: i === 0 ? text : '',
            image_url: imageUrl,  // ← Supabase URL
        });
    }
} catch (error) {
    toast.error('Ошибка отправки');
}
```

**Результат:**
- ✅ Файл загружен в Supabase Storage
- ✅ Запись создана в БД
- ✅ Supabase Realtime получает событие INSERT

---

## 4️⃣ **Realtime получает новое сообщение**

```tsx
chatService.subscribeToMessages(async (msg) => {
    // msg = {
    //     id: "real-abc-123",
    //     image_url: "https://supabase.co/storage/.../image.jpg",
    //     sender_id: user.id,
    //     ...
    // }
    
    // ПРЕДЗАГРУЗКА изображения с Supabase
    if (msg.image_url) {
        await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = msg.image_url!;
        });
    }
    
    // Замена optimistic на реальное
    setMessages(prev => {
        if (msg.sender_id === user.id) {
            // Ищем temp- сообщение
            const tempIdx = prev.findIndex(m =>
                m.id.startsWith('temp-') &&
                (m.content === msg.content || (m.image_url && msg.image_url))
            );
            
            if (tempIdx !== -1) {
                // ЗАМЕНЯЕМ temp- на real
                const next = [...prev];
                next[tempIdx] = msg;
                return next;
            }
        }
        
        // Или добавляем новое
        return [...prev, msg];
    });
});
```

**Результат:**
- ✅ Изображение с Supabase предзагружено
- ✅ temp- сообщение заменено на real
- ✅ Изображение становится **четким** (`opacity-100`)
- ✅ Нет пустых блоков (предзагрузка гарантирует это)

---

## 📊 Визуальные состояния:

### **Optimistic сообщение (temp-):**
```tsx
<img 
    src="blob:http://..." 
    className="blur-[2px] opacity-70"  // ← Размыто
/>
```

### **Реальное сообщение (real):**
```tsx
<img 
    src="https://supabase.co/..." 
    className="opacity-100"  // ← Четко
/>
```

---

## ⚡ Ключевые особенности:

### 1. **Optimistic UI**
- Сообщение появляется **мгновенно**
- Пользователь видит обратную связь сразу
- Не нужно ждать загрузки на сервер

### 2. **Предзагрузка**
- Изображения с Supabase **предзагружаются**
- Замена происходит **без пустых блоков**
- Плавный переход blob → supabase

### 3. **Визуальная обратная связь**
- **Размытие** показывает "отправляется"
- **Четкость** показывает "доставлено"
- Нет loader'ов, только blur эффект

### 4. **Дедупликация**
- temp- сообщения **заменяются** на real
- Нет дублирования в списке
- ID меняется с `temp-123` на `real-abc`

---

## 🎯 Timeline отправки:

```
0ms     → Нажатие "Отправить"
0ms     → Очистка input/preview
0ms     → Создание optimistic msg
0ms     → Добавление в messages
0ms     → Рендеринг (размыто)
        
        [Параллельно]
100ms   → Upload в Supabase Storage
500ms   → INSERT в БД
600ms   → Realtime событие
700ms   → Предзагрузка Supabase URL
800ms   → Замена temp → real
800ms   → Рендеринг (четко)
```

---

## 🔍 Проблемы которые были решены:

### ❌ **Было:**
1. Пустые черные блоки при отправке
2. Пустые блоки при замене temp → real
3. Loader не показывался или показывался неправильно

### ✅ **Стало:**
1. Изображение видно сразу (размыто)
2. Предзагрузка предотвращает пустые блоки
3. Простой blur эффект вместо сложного loader'а

---

## 📝 Итог:

**Текущая логика:**
- ✅ Optimistic UI с blob URL
- ✅ Размытие для temp- сообщений
- ✅ Предзагрузка для Supabase URL
- ✅ Плавная замена temp → real
- ✅ Нет пустых блоков
- ✅ Простая и понятная реализация
