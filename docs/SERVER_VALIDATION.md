# Server-Side Validation Setup

This document describes the server-side validation implemented for the Calculator Service.

## Overview

The frontend performs calculations for UX purposes, but the **backend is the source of truth**. All critical calculations are validated and recalculated on the server using PostgreSQL triggers.

## Implemented Validations

### 1. Metrics Auto-Calculation

When `results` JSONB is updated, the trigger automatically recalculates:
- `total_cost_value` — Sum of all item totals from `results.summary`
- `total_items_count` — Count of items in `results.summary`

**Why?** Prevents malicious clients from submitting false totals.

### 2. Status Transition Validation

The trigger enforces the business state machine:

```
draft → sent → expert → changes → revision → expert
                    ↘ suppliers → invoice → completed
```

Invalid transitions (e.g., `draft → invoice`) are rejected with an error.

### 3. Zones Count Validation

`zones_count` is automatically synced with `jsonb_array_length(zone_details)`.

### 4. Status Constraint

A CHECK constraint ensures only valid status values can be stored.

## Applying the Migration

### Option A: Supabase CLI (Recommended)

```bash
# Push migration to remote database
npx supabase db push

# Or reset and re-apply all migrations
npx supabase db reset
```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard → SQL Editor
2. Open and run: `supabase/migrations/20260108_server_validation_triggers.sql`

### Option C: Via psql

```bash
psql $DATABASE_URL -f supabase/migrations/20260108_server_validation_triggers.sql
```

## Testing

Run these queries in SQL Editor to verify:

```sql
-- Test 1: Invalid status transition (should fail)
UPDATE calculations SET status = 'invoice' WHERE status = 'draft';
-- Expected: ERROR: Invalid status transition from "draft" to "invoice"

-- Test 2: Metrics recalculation
UPDATE calculations 
SET results = '{"summary": [{"price": 100, "quantity": 5, "total": 500}]}'::jsonb
WHERE id = (SELECT id FROM calculations LIMIT 1);

SELECT total_cost_value, total_items_count 
FROM calculations 
WHERE id = (SELECT id FROM calculations LIMIT 1);
-- Expected: total_cost_value = 500, total_items_count = 1

-- Test 3: Valid status transition (should succeed)
UPDATE calculations SET status = 'sent' WHERE status = 'draft';
```

## Error Handling

Frontend should catch and display validation errors:

```typescript
try {
    await calculationService.update(id, { status: 'invoice' });
} catch (error) {
    if (error.code === '23514') { // check_violation
        toast.error('Недопустимый переход статуса');
    }
}
```

## Rollback

To remove triggers (if needed):

```sql
DROP TRIGGER IF EXISTS trg_calculations_before_upsert ON calculations;
DROP TRIGGER IF EXISTS trg_validate_zones_count ON calculations;
DROP FUNCTION IF EXISTS calculations_before_upsert();
DROP FUNCTION IF EXISTS validate_zones_count();
DROP FUNCTION IF EXISTS validate_status_transition(text, text);
DROP FUNCTION IF EXISTS calculate_results_metrics(jsonb);
ALTER TABLE calculations DROP CONSTRAINT IF EXISTS chk_calculation_status;
```
