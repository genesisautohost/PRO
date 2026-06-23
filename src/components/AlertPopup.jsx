import { useEffect, useState } from 'react'

/**
 * Themed "intrusion alert" popup — part of the recon demonstration. It shows
 * stylized trace logs to dramatize passive exposure. The activity is SIMULATED
 * (clearly tagged), built from the visitor's own client signals; nothing is
 * actually tracked, logged, or sent anywhere.
 */
const PAGES = ['/', '/recon', '/arsenal', '/contact', '/whoami', '/findings']
const NOTES = [
  'fingerprint matched',
  'canvas hash logged',
  'tz + locale correlated',
  'referrer chain stored',
  'GPU signature pinned',
  'audio hash matched',
  'viewport profiled',
  'reconnect — same device',
]

function pad(n) { return String(n).padStart(2, '0') }

function buildLogs(count) {
  const rows = []
  const now = Date.now()
  for (let i = 0; i < Math.min(count, 6); i++) {
    const t = new Date(now - Math.floor(Math.random() * 86400000))
    const ip = [44, 192, 168, 51][i % 4] + '.' +
      (10 + Math.floor(Math.random() * 240)) + '.' +
      Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)
    rows.push({
      ts: `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`,
      ip,
      page: PAGES[Math.floor(Math.random() * PAGES.length)],
      note: NOTES[Math.floor(Math.random() * NOTES.length)],
    })
  }
  return rows.sort((a, b) => (a.ts < b.ts ? 1 : -1))
}

export default function AlertPopup() {
  const [show, setShow] = useState(false)
  const [count] = useState(() => 19 + Math.floor(Math.random() * 14)) // ~19–32
  const [logs] = useState(() => buildLogs(6))

  useEffect(() => {
    if (sessionStorage.getItem('intrusion_seen') === '1') return
    const t = setTimeout(() => setShow(true), 5200)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    sessionStorage.setItem('intrusion_seen', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="intrusion mono" role="alert">
      <button className="intrusion-x" onClick={close} aria-label="dismiss">×</button>
      <div className="intrusion-head">
        <span className="intrusion-dot" />
        ⚠ PASSIVE TRACE DETECTED
      </div>
      <div className="intrusion-lead">
        Your address has been fingerprinted <b>{count}×</b> in the last 24h.
      </div>
      <div className="intrusion-logs">
        {logs.map((l, i) => (
          <div className="intrusion-row" key={i}>
            <span className="it-ts">{l.ts}</span>
            <span className="it-ip">{l.ip}</span>
            <span className="it-note">{l.page} · {l.note}</span>
          </div>
        ))}
      </div>
      <div className="intrusion-foot">
        // simulated — illustrates how exposed an ordinary visit is. nothing here is
        actually tracked or stored.
      </div>
      <button className="intrusion-action" onClick={close}>acknowledge</button>
    </div>
  )
}
