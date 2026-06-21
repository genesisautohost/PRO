/**
 * 100% client-side passive-exposure demo. Nothing is logged, stored, or
 * transmitted except the visitor's OWN public-IP lookup (ipapi.co, with an
 * ipwho.is fallback). Swap those for your own backend if you don't want
 * visitor IPs touching a third party.
 *
 * runVisitorScan(bodyEl) animates the readout into the given terminal element.
 */

function gpu() {
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl') || c.getContext('experimental-webgl')
    const e = g.getExtension('WEBGL_debug_renderer_info')
    return (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)) || 'hidden'
  } catch (_) {
    return 'hidden'
  }
}

function canvasFingerprint() {
  try {
    const c = document.createElement('canvas')
    const x = c.getContext('2d')
    x.textBaseline = 'top'
    x.font = '14px Arial'
    x.fillStyle = '#f60'
    x.fillRect(0, 0, 120, 30)
    x.fillStyle = '#069'
    x.fillText('0xshikhar \u{1F47E}', 2, 2)
    const s = c.toDataURL()
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return '0x' + h.toString(16).toUpperCase().padStart(8, '0')
  } catch (_) {
    return 'n/a'
  }
}

function buildSequence() {
  const nav = navigator
  const scr = screen
  const ua = nav.userAgent
  const seq = [
    ['[+] user agent', ua.length > 56 ? ua.slice(0, 56) + '…' : ua, false],
    ['[+] platform / os', nav.platform || 'unknown', false],
    ['[+] languages', (nav.languages || [nav.language]).join(', '), false],
    ['[+] timezone', Intl.DateTimeFormat().resolvedOptions().timeZone, false],
    ['[+] local time', new Date().toString().replace(/\s*\(.+\)\s*$/, ''), false],
    [
      '[+] screen',
      scr.width + '×' + scr.height + ' @' + (window.devicePixelRatio || 1) + 'x · ' + scr.colorDepth + '-bit',
      false,
    ],
    ['[+] viewport', window.innerWidth + '×' + window.innerHeight, false],
    ['[+] cpu cores', String(nav.hardwareConcurrency || 'hidden'), false],
    ['[+] device memory', nav.deviceMemory ? nav.deviceMemory + ' GB' : 'hidden', false],
    ['[+] touch points', String(nav.maxTouchPoints || 0), false],
    ['[+] gpu', gpu(), true],
    ['[+] do not track', nav.doNotTrack === '1' ? 'on' : 'off — you are trackable', nav.doNotTrack !== '1'],
    ['[+] cookies', nav.cookieEnabled ? 'enabled' : 'disabled', false],
    ['[!] canvas fingerprint', canvasFingerprint(), true],
  ]
  if (nav.connection && nav.connection.effectiveType) {
    seq.splice(10, 0, [
      '[+] connection',
      nav.connection.effectiveType + ' · ~' + (nav.connection.downlink || '?') + ' Mbps',
      false,
    ])
  }
  return seq
}

export function runVisitorScan(body) {
  if (!body || body.dataset.ran === '1') return
  body.dataset.ran = '1'

  const row = (k, v, danger) => {
    const d = document.createElement('div')
    d.className = 'row'
    const kk = document.createElement('span')
    kk.className = 'k'
    kk.textContent = k
    const vv = document.createElement('span')
    vv.className = 'v' + (danger ? ' danger' : '')
    vv.textContent = v
    d.appendChild(kk)
    d.appendChild(vv)
    body.appendChild(d)
  }

  const seq = buildSequence()

  const ipLookup = () => {
    const line = document.createElement('div')
    line.className = 'ln'
    line.textContent = '> resolving network identity…'
    body.appendChild(line)

    const fill = (ip, loc, org) => {
      line.remove()
      row('[!] ip address', ip || 'unavailable', true)
      row('[!] approx location', loc || 'unavailable', true)
      row('[+] isp / org', org || 'unavailable', false)
      const end = document.createElement('div')
      end.className = 'ln'
      end.style.color = 'var(--steel)'
      end.textContent = '> scan complete · ' + (seq.length + 3) + ' attributes exposed'
      body.appendChild(end)
    }

    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 6000)
    fetch('https://ipapi.co/json/', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        clearTimeout(to)
        fill(d.ip, [d.city, d.region, d.country_name].filter(Boolean).join(', '), d.org || (d.asn ? 'AS' + d.asn : ''))
      })
      .catch(() => {
        clearTimeout(to)
        fetch('https://ipwho.is/')
          .then((r) => r.json())
          .then((d) => {
            fill(d.ip, [d.city, d.region, d.country].filter(Boolean).join(', '), d.connection && d.connection.isp)
          })
          .catch(() => {
            line.remove()
            row('[!] ip address', 'blocked here — resolves live once deployed', true)
          })
      })
  }

  const scan = document.createElement('div')
  scan.className = 'ln'
  scan.style.color = 'var(--steel)'
  scan.textContent = '> scanning visitor…'
  body.appendChild(scan)

  let i = 0
  const step = () => {
    if (i < seq.length) {
      row(seq[i][0], seq[i][1], seq[i][2])
      i++
      setTimeout(step, 70)
    } else {
      scan.remove()
      ipLookup()
    }
  }
  step()
}
