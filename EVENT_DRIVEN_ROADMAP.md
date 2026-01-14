# Roadmap: Transition to Fully Event-Driven Messaging

This document provides a technical blueprint for evolving the HoReCa Inventory
System messaging architecture. The goal is to eliminate manual triggers for
system communications, moving all logic to a reliable, scalable, and automated
Event-Driven workflow.

---

## 📅 Step-by-Step Implementation Plan

### Phase 1: Database Logic Expansion (Foundation)

1. **Refactor Audit Log**: Ensure every status change in `calculations` table
   creates a corresponding row in `calculation_audit_log` via a Database
   Trigger.
2. **Schema Extension**: Add `metadata (jsonb)` and `message_type (text)`
   columns to the `messages` table to support interactive cards and system
   markers.
3. **Template Table**: Create `sys_message_templates` table to move text out of
   source code.

### Phase 2: Centralized Dispatcher (Engine)

1. **Template Mapper**: Create a table/JSON mapping that binds
   `calculation_status` to a specific `template_id`.
2. **Supabase Edge Function (The Dispatcher)**: Refactor
   `handle-calculation-events` to act as a generic dispatcher.
   - It listens for `INSERT` into `calculation_audit_log`.
   - It looks up the correct template based on the new status.
   - It replaces placeholders (e.g., `{{clientName}}`, `{{projectNo}}`) with
     real data.
   - It inserts the final message into `messages`.

### Phase 3: Frontend Cleanup

1. **Remove Manual Triggers**: Remove code from managers' dashboards that
   explicitly sends "Welcome" or "Success" messages. The frontend should only
   call `updateStatus()`.
2. **Real-time Optimization**: Ensure the chat UI correctly renders
   `message_type: 'action_card'` using a dedicated component factory.

---

## 📝 1. Centralized Template Management

### Proposed Schema: `sys_message_templates`

```sql
CREATE TABLE sys_message_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_status text UNIQUE,      -- e.g., 'PAID', 'ASSIGNED'
    body_markdown text NOT NULL,     -- e.g., "Hello {{name}}, your order #{{id}} is confirmed."
    action_config jsonb,             -- Config for Action-Cards (buttons, links)
    created_at timestamptz DEFAULT now()
);
```

**Benefits**:

- **Zero-Downtime Updates**: Marketing/Ops can change message wording in the DB
  without a developer redeploying code.
- **Localization Ready**: Easily add a `language` column for multi-lingual
  support.

---

## 🛠 2. Technical Enhancements & Scalability

### Robustness & Reliability

- **Retry Mechanism**: If the Edge Function fails (e.g., API timeout), use a
  "Retry-Queue" pattern. Any audit log entry with `processed: false` older than
  5 minutes should be picked up by a cron job (Supabase Edge Cron).
- **Idempotency**: Use the `event_reference_id` in the `messages` table to
  ensure that one status change NEVER sends the same automated message twice.

### Message Versioning

- Store a snapshot of the template used in the message record itself. If a
  template changes later, the history of old chats remains grammatically correct
  to the time they were sent.

---

## 📊 3. Analytics, Audit & SLA

### Key Performance Indicators (KPIs)

- **Time-to-Initial-Contact (SLA)**: Measure the time between
  `calculation.submitted` (Client) and `calculation.assigned` ->
  `welcome_message` (Expert). _Target: < 2 hours during business hours._
- **System Automation Ratio**: Track % of messages sent by `system_actor` vs
  `manual_actor`.
- **Workflow Bottleneck Tracking**: Analytics on which automated message has the
  lowest "Next Action" conversion (e.g., "User reads payment instruction but
  doesn't pay for 48h").

---

## 💎 4. Killer Features (Innovation)

### 🚀 Interactive Action-Cards (UX Native)

Transition messages from "Read-Only" to "Interactive".

- **Roadmap Card**: Instead of a text list, show a visual progress bar with "In
  Processing", "Ordered", "Shipped" steps.
- **Payment Card**: Embedded "Pay Now" button that opens the payment gateway
  directly, skipping 3 menu clicks.

### 🚀 Simulated Human Presence (Premium Feel)

- **Logic**: The Edge Function calculates the message immediately but schedules
  a "Delayed Broadcast".
- **UX**: 1 second after status change -> Show "Typing..." in chat. 5 seconds
  later -> Reveal the message.
- **Why**: Purely psychological comfort for HoReCa clients who want to feel
  "attended to" by a human expert.

### 🚀 AI-Powered Escalation

- **Logic**: Use an LLM to pre-process client replies to automated messages.
- **Action**: If a client replies "I don't understand the invoice," the system
  auto-tags the message as `priority: high` and flags the Manager in real-time.

### 🚀 Multi-Channel Resilience

- If the `is_read` marker for an automated message is still `false` after 30
  minutes, automatically forward the message to the user's **Telegram** or
  **WhatsApp** via an Edge Function integration.

---

## ✅ Summary of Impact

Transitioning to this workflow will turn the messaging system into a
**"Strategic Orchestrator"** of the business. It reduces human error, provides
transparent audit trails for owners, and creates a premium, high-tech experience
for HoReCa clients.
