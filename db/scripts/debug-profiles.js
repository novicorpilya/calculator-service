import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkManager() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'manager')
        .limit(1);
    
    if (error) {
        console.error('Error fetching manager:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Found manager:', data[0].email, data[0].id);
    } else {
        console.log('No manager found in profiles table.');
    }
}

checkManager();
