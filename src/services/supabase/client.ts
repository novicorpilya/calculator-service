import { createClient } from '@supabase/supabase-js';
import { authStorage } from './storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

/**
 * Инициализация клиента Supabase с кастомным хранилищем.
 * Это позволяет динамически управлять сессией через localStorage/sessionStorage.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export type { User } from '@supabase/supabase-js';
