# System Architecture: Feature-Oriented Layered Architecture

This project follows a modern **Feature-Oriented Layered Architecture**. Each
functional module is encapsulated within the `src/features` directory, promoting
modularity and isolation.

---

## 1. Core Principles

- **Modularity**: Code is grouped by features (e.g., `chat`, `auth`,
  `dashboard`).
- **Separation of Concerns**: Logic is divided into distinct layers
  (Repositories, Services, Hooks, UI).
- **Dependency Injection (DI)**: Services are managed via a central
  `ServiceContainer` to facilitate testing and flexibility.
- **Reactive State**: Server state is managed by `TanStack Query` with
  Optimistic UI enhancements.

---

## 2. Directory Structure Overview

```text
src/
├── app/            # Global providers, Auth context, Routing
├── core/           # Shared infrastructure (DI, Logging, Validation, Base Types)
├── features/       # Feature modules (The heart of the application)
│   ├── chat/
│   │   ├── components/    # Feature-specific UI
│   │   ├── hooks/         # React Query hooks (State & Mutations)
│   │   ├── services/      # Business logic (Application layer)
│   │   ├── repositories/  # Data access (Persistence layer)
│   │   ├── domain/        # Zod schemas & Domain types
│   │   └── types/         # TypeScript interfaces
├── services/       # Singleton infrastructure services (Supabase, Audit)
├── components/     # Shared UI components (Atomic design)
└── pages/          # Page-level compositions
```

---

## 3. The Architecture Layers

### A. Infrastructure Layer (`src/services`, `src/core`)

External integrations like **Supabase**. This layer provides the raw tools for
data persistence, authentication, and file storage.

### B. Data Access Layer (Repositories)

Encapsulated within `features/*/repositories`.

- **Responsibility**: CRUD operations, querying database via Supabase client,
  and parsing data through Zod schemas.
- **Example**: `ChatRepository` handles fetching messages and marking them as
  read.

### C. Application Layer (Services)

Encapsulated within `features/*/services`.

- **Responsibility**: Orchestrating business logic. Services combine repository
  calls with other utilities (like broadcasting).
- **Example**: `ChatService` sends a message and simultaneously broadcasts a
  notification to other users.

### D. Logic & State Layer (Hooks)

Encapsulated within `features/*/hooks`.

- **Responsibility**: Interfacing between the UI and Services. Using
  `TanStack Query` for caching, pre-fetching, and **Optimistic UI**.
- **Example**: `useMessages` manages the message list state and provides
  mutation functions.

### E. Presentation Layer (Components)

Encapsulated within `features/*/components` and `src/components`.

- **Responsibility**: Rendering the UI. Components are "pure" in terms of logic,
  relying on hooks for data and actions.

---

## 4. Key Implementation Patterns

### 🧩 Dependency Injection (DI)

The `ServiceContainer.tsx` (in `src/core/di`) initializes all services and
provides them via the `useServices` hook. This ensures that services are
singletons and can be easily swapped for mocks in tests.

### ⚡ Real-time & Synchronization

The system uses **Supabase Realtime** and **Broadcast Channels** for:

- Instant message delivery.
- Cross-tab synchronization (e.g., marking as read in one tab updates all
  others).
- Atomic replacement of Optimistic UI placeholders.

### 🛡️ Data Validation

Every piece of data entering the system from the backend is validated using
**Zod** (`domain/schemas.ts`). This prevents runtime errors due to corrupted or
unexpected data structures.

---

## 5. Maintenance & Scaling

To add a new feature:

1. Create a folder in `src/features`.
2. Define the schema in `domain/`.
3. Implement the `Repository` and `Service`.
4. Register them in `ServiceContainer.tsx`.
5. Create `hooks` for UI interaction.
6. Build the `components`.
