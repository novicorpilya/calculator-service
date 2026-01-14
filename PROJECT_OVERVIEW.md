# Project Overview: HoReCa Inventory Management System

## 🌟 Concept & Mission

This platform is a professional Ecosystem for the HoReCa sector (Hotels,
Restaurants, Cafes). Its primary mission is to transform chaotic, manual
inventory management into a transparent, data-driven workflow. By combining
algorithmic calculations with expert auditing, it ensures that businesses
maintain optimal stock levels while complying with strict HACCP sanitary
standards.

---

## 🏗 Architecture & Technical Stack

The project is built with scalability and modularity as top priorities,
following a **Feature-Oriented Layered Architecture**.

### **Frontend**

- **Framework**: React 19 + TypeScript.
- **Styling**: Tailwind CSS with a custom Design System (Glassmorphism,
  dark/vibrant aesthetics).
- **Core Libraries**: React Query (Server State), Lucide (Icons), Sonner
  (Toasts), React Hook Form + Zod (Validation).

### **Backend (BaaS)**

- **Supabase**: Leveraged for PostgreSQL, Auth, Realtime (Sync), and Storage.
- **Node.js Edge Functions**: For heavy calculation logic and integrations.
- **Security**: Granular **Row Level Security (RLS)** ensuring that data
  isolation is handled at the database level.

### **Internal Patterns**

- **Dependency Injection (IoC)**: Services are managed via a central
  `ServiceContainer`, ensuring that business logic is decoupled from the UI
  layer.
- **Service Layer**: All business rules are encapsulated in standalone services
  (`CalculationService`, `ChatService`, etc.).

---

## 🛠 Core Modules

1. **Calculation Engine**: The "brain" of the app. It calculates stock
   requirements based on area (sqm), staff count, daily visitors, and
   BICSc/HACCP intensity coefficients.
2. **Chat Hub Contextual Messaging**: Real-time communication between clients
   and experts, where messages are linked to specific projects/calculations.
3. **Smart Inventory Wizard**: A step-by-step onboarding process for new
   facilities, supporting auto-fill from existing venue templates.
4. **Expert Audit Workflow**: A dedicated interface for auditors to review
   client-submitted data, suggest SKU replacements, and generate final invoices.

---

## 🚀 Killer Features (Innovative Roadmap)

As a Senior Lead, I propose the following high-value features to define the
product's competitive edge:

### 1. **AI-Vision Receipt & Shelf OCR**

- **What**: Uploading photos of invoices or pantry shelves.
- **Value**: Eliminates manual input errors. The system automatically parses
  SKU, quantities, and prices, updating the database in seconds.
- **Tech**: Supabase Edge Functions + Vision API (LLM-based parsing).

### 2. **Collaborative "Live Audit" Workspace**

- **What**: Real-time shared view for Expert and Client.
- **Value**: The Expert can "remote control" or point to UI elements in the
  client's view during a consultation, resolving questions instantly without
  screen sharing.
- **Tech**: Supabase Realtime Presence & Broadcast channels.

### 3. **Smart Replenishment Forecasting (Demand Sensing)**

- **What**: Predicting stock depletion based on seasonal trends and historical
  data.
- **Value**: Prevents "out-of-stock" scenarios during holidays or local events.
- **Tech**: Calculation Engine enhancement using historical PostgreSQL data.

### 4. **Anomalous Consumption Detection**

- **What**: Automatic alerts when consumption of a specific product (e.g.,
  napkins or cleaning chemicals) deviates from the norms of similar venues.
- **Value**: Detects potential theft, wastage, or inefficient equipment before
  they impact the bottom line.

### 5. **Supplier "Best-Price" Auctioneer**

- **What**: A module that simulates your current calculation across different
  supplier price lists.
- **Value**: Automatically finds the cheapest mix of suppliers for the required
  inventory, generating ready-to-send POs (Purchase Orders).

---

## 🔐 Security & Operations

- **RBAC**: Three distinct roles (**Client, Expert/Manager, Admin**) with
  completely different UI paths and data access.
- **Audit Logs**: Every critical change (price updates, inventory deletions) is
  logged for security compliance.
- **Reliability**: Optimistic UI updates ensure that the application feels
  "instant" even on unstable mobile connections in kitchen/storage environments.
