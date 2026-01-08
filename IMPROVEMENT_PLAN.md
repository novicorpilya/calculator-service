# 🚀 План улучшений проекта HICS

**Дата создания**: 2026-01-07  
**Приоритет**: Критичные → Важные  
**Оценка времени**: ~40-50 часов разработки

---

## 📋 Оглавление

1. [🔴 Критичные задачи](#-критичные-задачи)
   - [1.1 Замена Math.random() на crypto.randomUUID()](#11-замена-mathrandom-на-cryptorandomuuid)
   - [1.2 Добавление пагинации](#12-добавление-пагинации)
   - [1.3 Создание CI Pipeline](#13-создание-ci-pipeline)
   - [1.4 Завершение миграции архитектуры](#14-завершение-миграции-архитектуры)
2. [🟡 Важные задачи](#-важные-задачи)
   - [2.1 Декомпозиция компонентов](#21-декомпозиция-компонентов)
   - [2.2 Unit-тесты для сервисов](#22-unit-тесты-для-сервисов)
   - [2.3 Настройка Prettier + Husky](#23-настройка-prettier--husky)
   - [2.4 Централизация валидации UUID](#24-централизация-валидации-uuid)

---

## 🔴 Критичные задачи

### 1.1 Замена Math.random() на crypto.randomUUID()

**Оценка времени**: 1 час  
**Риск**: Критический (безопасность)  
**Файлы для изменения**:
- `src/services/admin.service.ts`

#### Шаг 1: Найти все использования Math.random() для токенов

```bash
# Поиск в проекте
grep -r "Math.random" src/
```

#### Шаг 2: Создать утилиту для генерации токенов

**Создать файл**: `src/core/utils/crypto.ts`

```typescript
/**
 * Криптографически безопасная генерация токенов.
 */
export const generateSecureToken = (): string => {
    return crypto.randomUUID();
};

/**
 * Генерация короткого токена (для invite links).
 * Использует криптографически безопасный источник случайности.
 */
export const generateShortToken = (length: number = 24): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(36)).join('').slice(0, length);
};
```

#### Шаг 3: Заменить в admin.service.ts

**До:**
```typescript
const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
```

**После:**
```typescript
import { generateSecureToken } from '@/core/utils/crypto';

// В методе createInvitation:
const token = generateSecureToken();
```

#### Шаг 4: Проверить другие места использования

- [ ] `src/services/admin.service.ts` — createInvitation
- [ ] Проверить, нет ли других мест с Math.random() для security-целей

#### Чеклист завершения:
- [ ] Утилита создана
- [ ] admin.service.ts обновлён
- [ ] Тест на генерацию токена добавлен
- [ ] Приглашения работают корректно

---

### 1.2 Добавление пагинации

**Оценка времени**: 6-8 часов  
**Риск**: Средний (производительность)  
**Файлы для изменения**:
- `src/features/chat/repositories/ChatRepository.ts`
- `src/features/chat/hooks/useMessages.ts`
- `src/features/dashboard/repositories/CalculationRepository.ts`
- `src/services/chat.service.ts`

#### Шаг 1: Добавить типы для пагинации

**Создать файл**: `src/core/types/pagination.ts`

```typescript
export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export const DEFAULT_PAGE_SIZE = 50;
```

#### Шаг 2: Обновить ChatRepository

**Файл**: `src/features/chat/repositories/ChatRepository.ts`

```typescript
import { DEFAULT_PAGE_SIZE, type PaginationParams, type PaginatedResult } from '@/core/types/pagination';

// Добавить в интерфейс IChatRepository:
getMessages(userId: string, contactId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;

// Обновить метод:
async getMessages(
    userId: string, 
    contactId: string,
    pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<Message>> {
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Получаем общее количество
    const { count } = await this.client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`);

    // Получаем страницу данных (с конца для чата)
    const { data, error } = await this.client
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        this.logger.error('Failed to fetch messages', { userId, contactId }, error);
        throw new InfrastructureError('FETCH_MESSAGES_FAILED', error);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
        data: z.array(MessageSchema).parse(data?.reverse() || []),
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}
```

#### Шаг 3: Добавить infinite scroll hook

**Создать файл**: `src/features/chat/hooks/useInfiniteMessages.ts`

```typescript
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { DEFAULT_PAGE_SIZE } from '@/core/types/pagination';

export function useInfiniteMessages(currentUserId: string, selectedUserId: string) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();

    const queryKey = ['messages', currentUserId, selectedUserId];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => 
            chatService.getMessages(currentUserId, selectedUserId, { 
                page: pageParam, 
                pageSize: DEFAULT_PAGE_SIZE 
            }),
        getNextPageParam: (lastPage) => 
            lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
        enabled: !!currentUserId && !!selectedUserId,
    });

    // Flatten all pages into single array
    const messages = data?.pages.flatMap(page => page.data) || [];

    return {
        messages,
        isLoading,
        error: error?.message,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}
```

#### Шаг 4: Добавить пагинацию в CalculationRepository

**Файл**: `src/features/dashboard/repositories/CalculationRepository.ts`

Аналогичный подход:
- Добавить параметр pagination в методы `getByUserId`, `getUnassigned`, `getManagerWorkload`
- Возвращать `PaginatedResult<Calculation>`

#### Шаг 5: Обновить UI компоненты

Добавить "Load More" кнопку или infinite scroll:

```tsx
// В компоненте чата:
const { messages, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteMessages(userId, contactId);

// При скролле вверх:
const handleScroll = (e: React.UIEvent) => {
    if (e.currentTarget.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
    }
};
```

#### Чеклист завершения:
- [ ] Типы пагинации созданы
- [ ] ChatRepository обновлён
- [ ] CalculationRepository обновлён
- [ ] useInfiniteMessages hook создан
- [ ] UI компоненты используют пагинацию
- [ ] Тесты на пагинацию

---

### 1.3 Создание CI Pipeline

**Оценка времени**: 2-3 часа  
**Риск**: Средний (DevOps)  
**Файлы для создания**:
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`

#### Шаг 1: Создать базовый CI workflow

**Создать файл**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript compiler
        run: npx tsc --noEmit

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --coverage
        continue-on-error: true  # Пока тестов мало

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          file: ./coverage/lcov.info
```

#### Шаг 2: Добавить E2E workflow (опционально)

**Создать файл**: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    name: Playwright Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

#### Шаг 3: Обновить package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

#### Шаг 4: Добавить secrets в GitHub

1. Перейти в Settings → Secrets and variables → Actions
2. Добавить:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### Чеклист завершения:
- [ ] CI workflow создан
- [ ] E2E workflow создан (опционально)
- [ ] Scripts в package.json обновлены
- [ ] Secrets настроены в GitHub
- [ ] Первый успешный запуск CI

---

### 1.4 Завершение миграции архитектуры

**Оценка времени**: 8-12 часов  
**Риск**: Высокий (рефакторинг)  
**Цель**: Удалить дублирующийся `src/services/chat.service.ts` и мигрировать всё на новую архитектуру

#### Шаг 1: Аудит текущего использования

```bash
# Найти все импорты старого сервиса
grep -r "from '@/services/chat.service'" src/
grep -r "from './chat.service'" src/
grep -r "chatService" src/ --include="*.ts" --include="*.tsx"
```

#### Шаг 2: Создать план миграции функций

| Старая функция | Новое место | Статус |
|----------------|-------------|--------|
| `getAllMessagesWithUser` | `ChatRepository.getMessages` | ✅ Есть |
| `getCalculationMessages` | `ChatRepository.getProjectMessages` | ⬜ Создать |
| `sendMessage` | `ChatService.sendMessage` | ✅ Есть |
| `uploadAttachment` | `ChatRepository.uploadFile` | ✅ Есть |
| `uploadVoiceMessage` | `ChatRepository.uploadFile` | ✅ Есть |
| `getRecipients` | `ChatRepository.getRecipients` | ✅ Есть |
| `clearChatHistory` | `ChatService.clearHistory` | ✅ Есть |
| `clearProjectHistory` | `ChatService.clearProjectHistory` | ⬜ Создать |
| `markAsRead` | `ChatService.markAsRead` | ✅ Есть |
| `subscribeToMessages` | `useChatSubscription` hook | ✅ Есть |
| `subscribeToCalculations` | Отдельный hook | ⬜ Создать |
| `sendSyncSignal` | `BroadcastService` | ✅ Есть |
| `getUnreadCount` | `ChatRepository.getUnreadCounts` | ✅ Есть |

#### Шаг 3: Добавить недостающие методы

**Файл**: `src/features/chat/repositories/ChatRepository.ts`

```typescript
// Добавить метод для сообщений проекта
async getProjectMessages(calculationId: string): Promise<Message[]> {
    const { data, error } = await this.client
        .from('messages')
        .select('*')
        .eq('calculation_id', calculationId)
        .order('created_at', { ascending: true });

    if (error) {
        this.logger.error('Failed to fetch project messages', { calculationId }, error);
        throw new InfrastructureError('FETCH_PROJECT_MESSAGES_FAILED', error);
    }
    return z.array(MessageSchema).parse(data);
}

// Добавить очистку истории проекта
async clearProjectHistory(calculationId: string): Promise<void> {
    const { error } = await this.client
        .from('messages')
        .delete()
        .eq('calculation_id', calculationId);

    if (error) {
        this.logger.error('Failed to clear project history', { calculationId }, error);
        throw new InfrastructureError('CLEAR_PROJECT_HISTORY_FAILED', error);
    }
}
```

#### Шаг 4: Создать hook для подписки на calculations

**Создать файл**: `src/features/dashboard/hooks/useCalculationsSync.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { SyncPayload } from '../dashboard.types';

export function useCalculationsSync(onSync: (payload: SyncPayload) => void) {
    useEffect(() => {
        const channel = supabase.channel(`calc_sync_${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'calculations' },
                (payload) => {
                    const id = payload.new?.id || payload.old?.id;
                    if (id) {
                        onSync({
                            id: String(id),
                            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                            ts: Date.now(),
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [onSync]);
}
```

#### Шаг 5: Обновить все импорты

Заменить все:
```typescript
import { chatService } from '@/services/chat.service';
```

На использование через DI:
```typescript
import { useServices } from '@/core/di/ServiceContainer';
// ...
const { chatService } = useServices();
```

#### Шаг 6: Удалить старый файл

После завершения миграции:
```bash
rm src/services/chat.service.ts
```

#### Шаг 7: Обновить ServiceContainer

**Файл**: `src/core/di/ServiceContainer.tsx`

Убедиться, что все необходимые сервисы экспортируются:

```typescript
interface IServiceContainer {
    chatService: ChatService;
    presenceService: IPresenceService;
    calculationService: CalculationService;
    auditService: AuditService;
    logger: LogManager;
}
```

#### Чеклист завершения:
- [ ] Все методы из старого сервиса перенесены
- [ ] Все импорты обновлены
- [ ] Старый файл удалён
- [ ] Все тесты проходят
- [ ] E2E тесты проходят
- [ ] Приложение работает корректно

---

## 🟡 Важные задачи

### 2.1 Декомпозиция компонентов

**Оценка времени**: 10-15 часов  
**Риск**: Средний  
**Цель**: Разбить большие компоненты на управляемые части

#### Целевые компоненты:

| Компонент | Размер | Приоритет |
|-----------|--------|-----------|
| `NewCalculationWizard.tsx` | ~55kb | 🔴 Высокий |
| `ClientCalculationDetails.tsx` | ~44kb | 🔴 Высокий |
| `InventoryManager.tsx` | ~29kb | 🟡 Средний |

#### Шаг 1: Декомпозиция NewCalculationWizard

**Новая структура**:
```
src/features/dashboard/client/components/wizard/
├── index.tsx                    # Re-exports
├── NewCalculationWizard.tsx     # Главный оркестратор (< 200 строк)
├── WizardContext.tsx            # Контекст состояния
├── steps/
│   ├── StepBasicInfo.tsx        # Шаг 1: Базовая информация
│   ├── StepZoneConfiguration.tsx # Шаг 2: Настройка зон
│   ├── StepCalculation.tsx      # Шаг 3: Расчёт
│   └── StepReview.tsx           # Шаг 4: Обзор
├── components/
│   ├── WizardProgress.tsx       # Индикатор прогресса
│   ├── WizardNavigation.tsx     # Кнопки навигации
│   └── ZoneEditor.tsx           # Редактор зоны
└── hooks/
    ├── useWizardState.ts        # Стейт wizard'а
    └── useCalculationEngine.ts  # Логика расчётов
```

#### Шаг 2: Создать WizardContext

```typescript
// src/features/dashboard/client/components/wizard/WizardContext.tsx
import { createContext, useContext, useReducer } from 'react';
import type { Zone, CalculationResults } from '@/features/dashboard/dashboard.types';

interface WizardState {
    step: number;
    organizationName: string;
    type: string;
    totalArea: number;
    staffCount: number;
    dailyVisitors: number;
    sanitaryLevel: string;
    replacementCycle: string;
    zones: Zone[];
    results: CalculationResults | null;
}

type WizardAction =
    | { type: 'SET_STEP'; payload: number }
    | { type: 'UPDATE_FIELD'; field: keyof WizardState; value: unknown }
    | { type: 'ADD_ZONE'; payload: Zone }
    | { type: 'REMOVE_ZONE'; payload: string }
    | { type: 'SET_RESULTS'; payload: CalculationResults }
    | { type: 'RESET' };

const WizardContext = createContext<{
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
} | null>(null);

export const useWizard = () => {
    const context = useContext(WizardContext);
    if (!context) throw new Error('useWizard must be used within WizardProvider');
    return context;
};

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(wizardReducer, initialState);
    return (
        <WizardContext.Provider value={{ state, dispatch }}>
            {children}
        </WizardContext.Provider>
    );
};
```

#### Шаг 3: Создать отдельные step-компоненты

Каждый step < 150-200 строк, фокус на одной ответственности.

#### Чеклист завершения:
- [ ] WizardContext создан
- [ ] Все steps выделены
- [ ] Hooks выделены
- [ ] Компонент < 200 строк
- [ ] Тесты обновлены

---

### 2.2 Unit-тесты для критичных сервисов

**Оценка времени**: 6-8 часов  
**Риск**: Низкий  

#### Шаг 1: Настроить Vitest

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/react-hooks jsdom
```

**Создать файл**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

#### Шаг 2: Создать setup файл

**Файл**: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/services/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
        channel: vi.fn(),
        removeChannel: vi.fn(),
    },
}));
```

#### Шаг 3: Написать тесты для AuthService

**Создать файл**: `src/features/auth/auth.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from '@/services/supabase';

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should login user with valid credentials', async () => {
            const mockUser = { id: 'user-1', email: 'test@test.com' };
            const mockSession = { access_token: 'token-123' };

            vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'user-1', email: 'test@test.com', role: 'client' },
                    error: null,
                }),
            } as any);

            const result = await authService.login({
                email: 'test@test.com',
                password: 'password123',
            });

            expect(result.token).toBe('token-123');
            expect(result.user.email).toBe('test@test.com');
        });

        it('should throw error on invalid credentials', async () => {
            vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid credentials' },
            } as any);

            await expect(
                authService.login({ email: 'bad@test.com', password: 'wrong' })
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('register', () => {
        it('should register new user', async () => {
            // Test implementation
        });

        it('should validate invite token if provided', async () => {
            // Test implementation
        });
    });
});
```

#### Шаг 4: Написать тесты для ChatRepository

**Создать файл**: `src/features/chat/repositories/ChatRepository.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ChatRepository } from './ChatRepository';

describe('ChatRepository', () => {
    const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    const mockClient = {
        from: vi.fn(),
        storage: { from: vi.fn() },
        rpc: vi.fn(),
    } as any;

    const repo = new ChatRepository(mockClient, mockLogger);

    describe('getMessages', () => {
        it('should fetch and validate messages', async () => {
            mockClient.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: [
                        { id: '1', sender_id: 'a', receiver_id: 'b', content: 'Hi', created_at: '2024-01-01' },
                    ],
                    error: null,
                }),
            });

            const result = await repo.getMessages('a', 'b');

            expect(result).toHaveLength(1);
            expect(result[0].content).toBe('Hi');
        });

        it('should throw InfrastructureError on failure', async () => {
            mockClient.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'DB Error' },
                }),
            });

            await expect(repo.getMessages('a', 'b')).rejects.toThrow();
        });
    });
});
```

#### Целевое покрытие:

| Сервис/Модуль | Целевое покрытие |
|---------------|------------------|
| AuthService | 80% |
| ChatRepository | 70% |
| CalculationRepository | 70% |
| Валидации (Zod schemas) | 90% |
| Утилиты (crypto, formatters) | 95% |

#### Чеклист завершения:
- [ ] Vitest настроен
- [ ] Setup файл создан
- [ ] AuthService протестирован
- [ ] ChatRepository протестирован
- [ ] Coverage > 50%

---

### 2.3 Настройка Prettier + Husky

**Оценка времени**: 1-2 часа  
**Риск**: Низкий  

#### Шаг 1: Установить зависимости

```bash
npm install -D prettier eslint-config-prettier husky lint-staged
```

#### Шаг 2: Создать конфиг Prettier

**Создать файл**: `.prettierrc`

```json
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "trailingComma": "es5",
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf"
}
```

**Создать файл**: `.prettierignore`

```
node_modules
dist
build
coverage
playwright-report
*.min.js
```

#### Шаг 3: Обновить ESLint конфиг

```javascript
// eslint.config.js
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
    // ... existing config
    prettierConfig, // Добавить в конец
]);
```

#### Шаг 4: Настроить Husky

```bash
npx husky init
```

**Создать файл**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### Шаг 5: Настроить lint-staged

**Добавить в package.json**:

```json
{
    "lint-staged": {
        "*.{ts,tsx}": [
            "eslint --fix",
            "prettier --write"
        ],
        "*.{json,md,css}": [
            "prettier --write"
        ]
    }
}
```

#### Шаг 6: Добавить scripts

```json
{
    "scripts": {
        "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
        "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
        "prepare": "husky"
    }
}
```

#### Чеклист завершения:
- [ ] Prettier установлен и настроен
- [ ] Husky установлен
- [ ] lint-staged настроен
- [ ] Pre-commit hook работает
- [ ] Весь код отформатирован

---

### 2.4 Централизация валидации UUID

**Оценка времени**: 2-3 часа  
**Риск**: Низкий  

#### Шаг 1: Создать модуль валидации

**Создать файл**: `src/core/validation/index.ts`

```typescript
import { z } from 'zod';
import { ApplicationError } from '@/core/errors/AppErrors';

// UUID Schema
export const UUIDSchema = z.string().uuid('Invalid UUID format');

// Валидатор с выбросом ошибки
export function validateUUID(value: unknown, fieldName = 'id'): string {
    const result = UUIDSchema.safeParse(value);
    if (!result.success) {
        throw new ApplicationError(
            'INVALID_UUID',
            `Некорректный формат ${fieldName}: ${value}`
        );
    }
    return result.data;
}

// Валидатор с возвратом boolean
export function isValidUUID(value: unknown): value is string {
    return UUIDSchema.safeParse(value).success;
}

// Email Schema
export const EmailSchema = z.string().email('Invalid email format');

export function validateEmail(value: unknown): string {
    const result = EmailSchema.safeParse(value);
    if (!result.success) {
        throw new ApplicationError('INVALID_EMAIL', 'Некорректный email');
    }
    return result.data;
}
```

#### Шаг 2: Обновить ChatRepository

```typescript
import { validateUUID, isValidUUID } from '@/core/validation';

// В методе getMessages:
async getMessages(userId: string, contactId: string): Promise<Message[]> {
    validateUUID(userId, 'userId');
    validateUUID(contactId, 'contactId');
    // ...
}

// В методе getRecipients:
async getRecipients(userId: string): Promise<ChatRecipient[]> {
    if (!isValidUUID(userId)) {
        this.logger.warn('getRecipients blocked: invalid userId', { userId });
        return [];
    }
    // ...
}
```

#### Шаг 3: Обновить CalculationRepository

```typescript
async getById(id: string | number): Promise<Calculation> {
    // Для числового ID пропускаем UUID валидацию
    if (typeof id === 'string') {
        validateUUID(id, 'calculationId');
    }
    // ...
}
```

#### Шаг 4: Обновить AuthService

```typescript
async getUserProfile(id: string): Promise<User | null> {
    if (!isValidUUID(id)) {
        return null;
    }
    // ...
}
```

#### Чеклист завершения:
- [ ] Модуль валидации создан
- [ ] ChatRepository обновлён
- [ ] CalculationRepository обновлён
- [ ] AuthService обновлён
- [ ] Тесты на валидацию написаны

---

## 📊 Общий таймлайн

```
Неделя 1 (Критичные):
├── День 1: Замена Math.random() + CI Pipeline
├── День 2-3: Пагинация (ChatRepository)
├── День 4-5: Пагинация (UI + CalculationRepository)
└── День 6-7: Миграция архитектуры (часть 1)

Неделя 2 (Критичные + Важные):
├── День 1-2: Миграция архитектуры (завершение)
├── День 3-4: Декомпозиция Wizard
├── День 5: Prettier + Husky
└── День 6-7: Централизация UUID + Unit-тесты

Неделя 3 (Важные):
├── День 1-3: Декомпозиция Details
├── День 4-7: Расширение тестового покрытия
```

---

## ✅ Критерии завершения проекта

- [ ] Все критичные задачи выполнены
- [ ] CI проходит без ошибок
- [ ] Покрытие тестами > 50%
- [ ] Нет файлов > 500 строк
- [ ] Все импорты используют новую архитектуру
- [ ] Документация обновлена

---

**Автор плана**: Antigravity  
**Версия**: 1.0  
**Последнее обновление**: 2026-01-07
