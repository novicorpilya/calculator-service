# System Architecture Update (Post-AI Cleanup)

**Date:** 2026-01-19 **Project:** HICS - Calculator Service

## 1. Overview

As of the current update, the system has been fully "de-智能化" (cleansed of AI
components). This includes removal of integrations with OpenAI, DeepSeek, and
Google Gemini to ensure a clean slate for future provider implementation.

## 2. Manager Dashboard Architecture

The Manager's workspace is now focused strictly on core KPI metrics and
performance tracking.

### Functional Components:

- **KPI Hub**: Real-time tracking of personal and team performance metrics.
- **Pipeline Monitor**: Direct access to calculations and projects assigned to
  the manager.
- **Service Integration**: `useManagerKPI` hook now handles only standard
  metrics loading via `ManagerDashboardService`.

### Data Flow:

1. `ManagerDashboard.tsx` -> invokes `useManagerKPI` hook.
2. Hook fetches data from `managerDashboardService`.
3. UI components (`PerformanceBreakdown`, `RecentReviews`) render raw data from
   Supabase.
4. _Removed_: AI Insight generation, feedback loops, and rotation logic.

## 3. Client Workspace Architecture

The client experience remains robust, focused on usability and transparent
calculation management.

### Functional Highlights:

- **Project Tracking**: High-definition view of current and historical
  calculations.
- **Interaction Layer**: Secure messaging system and venue management.
- **Profile System**: Self-service management of contact data and organization
  details.

## 4. Key Infrastructure Changes (Backend)

### Supabase Edge Functions:

- **`get-ai-insights`**: Reset to a minimal skeleton. Returns an empty success
  response. No external API calls are performed.
- **Security**: JWT validation is intact but external AI secrets are currently
  inactive.

### Database Layer (Post-migration):

- **Removed Tables**: `ai_insight_events`, `ai_insight_feedback`.
- **Removed Views**: `ai_metrics_summary`, `ai_feedback_summary`.
- **Removed Logic**: All RBAC policies related specifically to AI analytics are
  dropped.

## 5. Deployment Instructions

To synchronize the local state with the production environments:

1. **Database**: `npx supabase db push` (Removes AI tables and views).
2. **Edge Functions**: `npx supabase functions deploy get-ai-insights` (Resets
   the function logic).
3. **Environment**: Ensure `OPENAI_API_KEY` and `DEEPSEEK_API_KEY` can be safely
   removed from Supabase secrets if no longer needed.

---

_Senior Lead Notes: The system is now lean, predictable, and highly performant.
The "AI-Expert" module can be re-integrated in hours once a new provider (e.g.,
Anthropic or a stable DeepSeek account) is selected._
