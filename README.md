# HICS: Enterprise HoReCa Intelligence System

![Status](https://img.shields.io/badge/Production-Ready-success?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-blue?style=for-the-badge)
![Coverage](https://img.shields.io/badge/Coverage-85%25-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20DDD-orange?style=for-the-badge)

> **High-Load SaaS Platform for Restaurant Inventory Management & Audit.**
>
> Designed and engineered with a focus on **Security First**, **Domain-Driven Design (DDD)**, and **Scalability**. This project serves as a comprehensive demonstration of Senior/Lead level architectural patterns and full-cycle product development.

---

## 🏗️ Architectural Highlights

This repository demonstrates the ability to build complex, resilient systems without over-engineering.

### 1. Domain-Driven Design (DDD) Core

The business logic is strictly decoupled from the UI framework.

- **Rich Domain Models:** `CalculationEntity` encapsulates all inventory rules (HACCP norms, depreciation cycles).
- **Application Layer:** Orchestrates data flow via pure services, ensuring the UI remains thin and presentational.
- **Repository Pattern:** Abstracts the data source (Supabase), allowing for easy substitution (e.g., for testing or future migration).

### 2. Enterprise Security Architecture (Zero Trust)

Security is not an afterthought; it is baked into the database schema.

- **Row Level Security (RLS):** Strict policies ensure users can _only_ access their tenant's data. Even a compromised backend client cannot bypass DB-level constraints.
- **Role-Based Access Control (RBAC):** Custom PostgreSQL Claims & Triggers manage high-privilege roles (Admin/Auditor) securely.
- **RPC Hardening:** Critical operations (like quoting) are executed via atomic database functions, preventing client-side price tampering.

### 3. Performance & Resilience

- **Optimistic UI:** State updates immediately for 60fps perceived performance, synching in background via TanStack Query.
- **Edge Computing:** Heavy computations are offloaded to Supabase Edge Functions to keep the client bundle lightweight.
- **Reliability:** Comprehensive Error Boundaries and a custom `LogManager` ensure the app fails gracefully and reports telemetry.

---

## 🛠️ Technology Stack (Selection Rationale)

| Layer        | Tech Choice           | Rationale                                                                                     |
| :----------- | :-------------------- | :-------------------------------------------------------------------------------------------- |
| **Frontend** | React 18 / TypeScript | Strict strict-mode compliance for type safety on large-scale refactors.                       |
| **State**    | TanStack Query (v5)   | Eliminates boilerplate, handles caching/invalidation, and serves as our Server State Manager. |
| **Backend**  | Supabase (PostgreSQL) | Chosen for its robust RLS capabilities and built-in Realtime Engine (WebSockets).             |
| **Data**     | Zod                   | Runtime validation for all external inputs (API responses, forms) to ensure data integrity.   |
| **Styling**  | Tailwind CSS (v4)     | Atomic CSS for consistent Design System tokens and zero-runtime overhead.                     |
| **Testing**  | Playwright & Vitest   | Confidence via E2E workflows rather than brittle snapshot tests.                              |

---

## 📂 Project Structure (Feature-Sliced Design Spirit)

```text
src/
├── core/                   # Kernel: logging, configs, error handling (Framework Agnostic)
├── features/               # Vertical Slices (Auth, Budget, Chat, Dashboard)
│   ├── auth/
│   │   ├── domain/         # Business Rules & Entities
│   │   ├── components/     # UI Implementation
│   │   └── hooks/          # React Adapters
├── services/               # Infrastructure Layer (API Clients, 3rd Party Adapters)
└── app/                    # Composition Layer (Providers, Routing, DI Container)
```

---

## 🔒 Security Audit & Hardening

This project has undergone a self-conducted security hardening phase:

1.  **Immutability:** Audit logs are append-only.
2.  **Input Sanitization:** All user inputs are validated via Zod schemas before processing.
3.  **Dependency Isolation:** `npm audit` checks in CI pipeline; secrets managed via env vars (not committed).

---

## 🚀 Deployment & CI/CD workflow

The system is designed for **Atomic Deployments** via Vercel:

1.  **Code Commit:** Triggers Lint & Type Check.
2.  **Preview Env:** Deploys a unique URL for regression testing.
3.  **Production:** Only healthy builds are promoted.

### Quick Start (Local Dev)

```bash
# 1. Install dependencies (Legacy Peer Deps ensures stability)
npm install --legacy-peer-deps

# 2. Setup Env
cp .env.example .env

# 3. Apply DB Schema (RLS & Functions)
supabase db reset

# 4. Launch
npm run dev
```

---

## 👨‍💻 About the Author

**Ilya Novikov** — Senior Fullstack Engineer & Team Lead.
Specializing in building maintainable, high-impact systems at scale. Focused on Engineering Excellence, Developer Experience (DX), and delivering business value.

> _"Code is a liability. Functionality is an asset."_
