import { createClient } from '@supabase/supabase-js'

// These will be populated with environment variables later
// For now, we can use placeholders or empty strings, but the app should check for them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || ''

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'twodo-auth-token',
        flowType: 'pkce'
    }
})

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseKey);
