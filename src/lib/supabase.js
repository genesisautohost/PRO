import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client. The publishable (anon) key is SAFE to ship in the browser —
 * it only allows what your Row-Level-Security policies permit. The secret
 * (service_role / sb_secret_*) key must NEVER live in frontend code.
 *
 * EDIT:AUTH — these point at your Supabase project.
 */
export const SUPABASE_URL = 'https://lrwapztlmtbkhtlbvova.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q3wKCAPrnk6yaJBC5Vqw0Q_9yCXu4K-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Secure breach self-check (Edge Function). Checks ONLY the logged-in user's
// own confirmed email, server-side; returns breach names/descriptions only.
export const BREACH_CHECK_URL = `${SUPABASE_URL}/functions/v1/breach-check`
