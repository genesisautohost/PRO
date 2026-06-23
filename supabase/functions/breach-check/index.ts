// =============================================================================
// breach-check — Supabase Edge Function
//
// "Have-I-Been-Pwned"-style SELF check. A logged-in user can see WHICH breaches
// THEIR OWN registered email appears in — names + descriptions only.
//
// Hard guardrails (all enforced here on the server, not in the browser):
//   1. Requires a valid Supabase session (JWT).
//   2. The email checked is taken from the verified session — client input is
//      IGNORED. A user can never check anyone else's address.
//   3. The email MUST be confirmed (email_confirmed_at). Ownership is the whole
//      point — so "Confirm email" must stay ON in Auth settings. If you disable
//      confirmation, Supabase auto-confirms everyone and this guarantee is lost.
//   4. Raw records (SSNs, addresses, relatives, passwords) are STRIPPED. Only
//      the breach name + short description + a count are returned. No PII leaves
//      the server.
//
// Secrets (set with `supabase secrets set`):
//   LEAKOSINT_TOKEN   your API token
// (SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.)
// =============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGIN = 'https://shikharmishra.com'

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Not authenticated' }, 401, origin)

    // Verify the caller's JWT and load the user.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return json({ error: 'Not authenticated' }, 401, origin)

    // GUARDRAIL: only a confirmed email may be checked (proves ownership).
    if (!user.email || !user.email_confirmed_at) {
      return json(
        { error: 'Confirm your email first — you can only check an address you own.' },
        403, origin,
      )
    }

    // The query target is the verified session email. Any request body is ignored.
    const email = user.email

    const apiKey = Deno.env.get('LEAKOSINT_TOKEN')
    if (!apiKey) return json({ error: 'Server not configured' }, 500, origin)

    const upstream = await fetch('https://leakosintapi.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: apiKey, request: email, limit: 100, lang: 'en', type: 'json' }),
    })
    const data = await upstream.json().catch(() => ({}))

    if (data['Error code']) return json({ error: 'Lookup failed' }, 502, origin)

    // STRIP all raw records. Return only which breaches contain the email plus a
    // short description — never the Data rows (SSNs / addresses / relatives).
    const list = (data['List'] && typeof data['List'] === 'object') ? data['List'] : {}
    const breaches = Object.keys(list)
      .filter((name) => name && name !== 'No results found')
      .map((name) => {
        const info = typeof list[name]?.InfoLeak === 'string'
          ? list[name].InfoLeak.slice(0, 400) : ''
        const records = Array.isArray(list[name]?.Data) ? list[name].Data.length : 0
        return { name, info, records }
      })

    return json({ email, found: breaches.length, breaches }, 200, origin)
  } catch (_e) {
    return json({ error: 'Server error' }, 500, origin)
  }
})
