import { useEffect, useState } from 'react'

/**
 * Themed "intrusion alert" popup — part of the recon demonstration. It shows
 * stylized trace logs (with redacted **** fields) to dramatize passive
 * exposure. The activity is SIMULATED (clearly tagged): nothing is actually
 * tracked, captured, logged, or sent anywhere. The "fingerprinted N×" counter
 * is just a number kept in localStorage that ticks up a little each visit.
 */
const ACTIVITY = [
  { act: 'visited', tgt: 'facebook.com/profile/****' },
  { act: 'search', tgt: '"how to **** my ****"' },
  { act: 'login', tgt: 'g****r@gmail.com' },
  { act: 'visited', tgt: 'youtube.com/watch?v=****' },
  { act: 'visited', tgt: 'amazon.in/dp/B0****' },
  { act: 'typed', tgt: 'password: ********' },
  { act: 'visited', tgt: 'instagram.com/****' },
  { act: 'search', tgt: '"**** near me"' },
  { act: 'opened', tgt: 'wa.me · +91-98****-**42' },
  { act: 'visited', tgt: 'mail.****.com/inbox' },
  { act: 'visited', tgt: 'netflix.com/title/****' },
  { act: 'search', tgt: '"is **** legal in ****"' },
  { act: 'opened', tgt: 'maps · home → ****' },
  { act: 'login', tgt: 'paytm · ****6042' },
]

function pad(n) { return String(n).padStart(2, '0') }

function buildLogs() {
  const now = Date.now()
  const pool = [...ACTIVITY]
  const rows = []
  for (let i = 0; i < 6 && pool.length; i++) {
    const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const t = new Date(now - Math.floor(Math.random() * 86400000))
    rows.push({ ts: `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`, ...pick })
  }
  return rows.sort((a, b) => (a.ts < b.ts ? 1 : -1))
}

function nextCount() {
  let prev = parseInt(localStorage.getItem('trace_count') || '', 10)
  if (!Number.isFinite(prev)) prev = 18 + Math.floor(Math.random() * 8) // base 18–25
  const next = prev + (1 + Math.floor(Math.random() * 3)) // +1, +2, or +3
  try { localStorage.setItem('trace_count', String(next)) } catch (_) {}
  return next
}

export default function AlertPopup() {
  const [show, setShow] = useState(false)
  const [count] = useState(() => {
    try { return nextCount() } catch (_) { return 23 }
  })
  const [logs] = useState(buildLogs)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 5200)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div className="intrusion mono" role="alert">
      <button className="intrusion-x" onClick={() => setShow(false)} aria-label="dismiss">×</button>
      <div className="intrusion-head">
        <span className="intrusion-dot" />
        ⚠ PASSIVE TRACE DETECTED
      </div>
      <div className="intrusion-lead">
        Your address has been fingerprinted <b>{count}×</b> in the last 24h.
      </div>
      <div className="intrusion-sub">// captured activity</div>
      <div className="intrusion-logs">
        {logs.map((l, i) => (
          <div className="intrusion-row" key={i}>
            <span className="it-ts">{l.ts}</span>
            <span className="it-act">{l.act}</span>
            <span className="it-note">{l.tgt}</span>
          </div>
        ))}
      </div>
      <div className="intrusion-foot"></div>
      <button className="intrusion-action" onClick={() => setShow(false)}>acknowledge</button>
    </div>
  )
}
