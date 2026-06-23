import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * GitHub/email auth + members-only area, powered by Supabase.
 * - "Login" button (top HUD) opens a panel.
 * - Logged out → sign-up / log-in (email+password).
 * - Logged in → members-only content + logout.
 *
 * Security: Supabase handles password hashing, sessions and tokens on its
 * servers. Anything truly private should be stored in Supabase tables behind
 * Row-Level-Security, not just hidden in this UI.
 */
export default function Account() {
  const [session, setSession] = useState(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState(null) // admin-only list
  const [usersErr, setUsersErr] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // When signed in, look up whether this account is an admin. The check is
  // enforced by the database (RLS) — the UI flag below is only for showing the
  // panel; the actual "can read everyone" decision happens in Postgres.
  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      setUsers(null)
      setUsersErr(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(Boolean(data?.is_admin))
      })
    return () => { cancelled = true }
  }, [session])

  // Admins can read every profile (RLS grants it); everyone else only sees
  // their own row, so this query is safe to run from the browser.
  const loadUsers = async () => {
    setUsersErr(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('email, created_at, is_admin')
      .order('created_at', { ascending: false })
    if (error) return setUsersErr(error.message)
    setUsers(data || [])
  }

  const reset = () => {
    setErr(null)
    setMsg(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setMsg('Account created. Check your email to confirm, then log in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMsg(null)
        setPassword('')
      }
    } catch (e2) {
      setErr(e2.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    reset()
    if (!email) return setErr('Enter your email first, then tap reset.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setErr(error ? error.message : null)
    if (!error) setMsg('Password reset link sent — check your email.')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <>
      <button className="acct-btn mono" onClick={() => { reset(); setOpen(true) }}>
        {session ? '● members' : 'login'}
      </button>

      {open && (
        <div className="acct-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="acct-panel mono">
            <button className="acct-close" onClick={() => setOpen(false)} aria-label="close">×</button>

            {session ? (
              <div className="acct-members">
                <div className="acct-kicker">// members</div>
                <h3 className="acct-title">Access granted</h3>
                <p className="acct-sub">
                  Signed in as <b>{session.user.email}</b>
                </p>
                <div className="acct-gated">
                  <p>This is the members-only area. Gated content goes here — writeups,
                  private notes, tools. (Pull real protected data from Supabase tables
                  with Row-Level-Security.)</p>
                </div>

                {isAdmin && (
                  <div className="acct-admin">
                    <div className="acct-kicker">// admin · registered users</div>
                    {!users && (
                      <button className="acct-action" onClick={loadUsers}>load users</button>
                    )}
                    {usersErr && <div className="acct-err">{usersErr}</div>}
                    {users && (
                      <>
                        <div className="acct-count">{users.length} user{users.length === 1 ? '' : 's'}</div>
                        <div className="acct-table">
                          {users.map((u, i) => (
                            <div className="acct-row" key={i}>
                              <span className="acct-uemail">
                                {u.email || '(no email)'}{u.is_admin ? ' ★' : ''}
                              </span>
                              <span className="acct-udate">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button className="acct-link" onClick={loadUsers}>refresh</button>
                      </>
                    )}
                  </div>
                )}

                <button className="acct-action" onClick={logout}>log out</button>
              </div>
            ) : (
              <form className="acct-form" onSubmit={submit}>
                <div className="acct-kicker">// {mode === 'signup' ? 'create account' : 'sign in'}</div>
                <h3 className="acct-title">{mode === 'signup' ? 'Join' : 'Members login'}</h3>

                <label className="acct-label">email</label>
                <input className="acct-input" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />

                <label className="acct-label">password</label>
                <input className="acct-input" type="password" required minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

                {err && <div className="acct-err">{err}</div>}
                {msg && <div className="acct-msg">{msg}</div>}

                <button className="acct-action" type="submit" disabled={busy}>
                  {busy ? '…' : mode === 'signup' ? 'create account' : 'log in'}
                </button>

                {mode === 'login' && (
                  <button type="button" className="acct-link" onClick={forgot}>forgot password?</button>
                )}

                <div className="acct-toggle">
                  {mode === 'signup' ? 'already a member?' : 'no account?'}{' '}
                  <button type="button" onClick={() => { reset(); setMode(mode === 'signup' ? 'login' : 'signup') }}>
                    {mode === 'signup' ? 'log in' : 'sign up'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
