---
description: How to deploy the application to Production (Vercel + Supabase)
---

# Deployment Workflow

To deploy the **Calculator Service** to production, follow these steps:

## 1. Supabase (Database & Backend)

1. Log in to [Supabase Dashboard](https://app.supabase.com).
2. Create a new project or select an existing one.
3. Run all migrations from the `supabase/migrations` folder in order.
   - **Tip**: Use `supabase db push` if using the Supabase CLI.
4. Ensure the following Storage Buckets are created and set to the correct
   visibility:
   - `attachments` (Public: No, but policies allow access)
   - `voice-messages` (Public: No)
   - `receipts` (Public: No)

## 2. Environment Variables

Set the following variables in your hosting provider (e.g., Vercel):

### Frontend (VITE_ prefix)

- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
- `VITE_API_URL`: (Optional) Custom API URL if applicable.

### Server-side Secrets (No VITE_ prefix)

- `SUPABASE_SERVICE_ROLE_KEY`: Required for admin operations (if using edge
  functions).
- `RESEND_API_KEY`: Required for sending email notifications.

## 3. Frontend (Vercel)

// turbo

1. Run `npm run build` to verify the build passes.
2. Connect your repository to Vercel.
3. Set the "Build Command" to `npm run build`.
4. Set the "Output Directory" to `dist`.
5. Deploy!

## 4. Post-Deployment

1. Verify SSL (HTTPS) is active.
2. Test the Admin login and ensuring RLS policies are working correctly.
3. Check `system_logs` for any startup errors.
