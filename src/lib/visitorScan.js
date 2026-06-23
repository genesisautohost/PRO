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

function glVendor() {
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl') || c.getContext('experimental-webgl')
    const e = g.getExtension('WEBGL_debug_renderer_info')
    return (e ? g.getParameter(e.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR)) || 'hidden'
  } catch (_) {
    return 'hidden'
  }
}

// Best-effort browser + engine name from the UA string (purely cosmetic).
function uaInfo(ua) {
  let browser = 'unknown'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Safari\//.test(ua)) browser = 'Safari'
  let engine = 'unknown'
  if (/Gecko\/|Firefox/.test(ua) && !/like Gecko/.test(ua)) engine = 'Gecko'
  else if (/AppleWebKit/.test(ua)) engine = /Chrome|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit'
  return { browser, engine }
}

function colorGamut() {
  try {
    if (matchMedia('(color-gamut: rec2020)').matches) return 'rec2020 (wide)'
    if (matchMedia('(color-gamut: p3)').matches) return 'display-p3 (wide)'
    if (matchMedia('(color-gamut: srgb)').matches) return 'sRGB'
  } catch (_) {}
  return 'unknown'
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
  const { browser, engine } = uaInfo(ua)
  const mm = (q) => { try { return matchMedia(q).matches } catch (_) { return false } }
  const seq = [
    ['[+] user agent', ua.length > 56 ? ua.slice(0, 56) + '…' : ua, false],
    ['[+] browser', browser + ' · ' + engine + ' engine', false],
    ['[+] platform / os', nav.platform || 'unknown', false],
    ['[+] vendor', nav.vendor || 'hidden', false],
    ['[+] languages', (nav.languages || [nav.language]).join(', '), false],
    ['[+] timezone', Intl.DateTimeFormat().resolvedOptions().timeZone, false],
    ['[+] local time', new Date().toString().replace(/\s*\(.+\)\s*$/, ''), false],
    ['[!] came from', document.referrer || 'direct / hidden', !!document.referrer],
    [
      '[+] screen',
      scr.width + '×' + scr.height + ' @' + (window.devicePixelRatio || 1) + 'x · ' + scr.colorDepth + '-bit',
      false,
    ],
    ['[+] usable screen', scr.availWidth + '×' + scr.availHeight, false],
    ['[+] viewport', window.innerWidth + '×' + window.innerHeight, false],
    ['[+] orientation', (scr.orientation && scr.orientation.type) || 'unknown', false],
    ['[+] color scheme', mm('(prefers-color-scheme: dark)') ? 'dark' : 'light', false],
    ['[+] color gamut', colorGamut(), false],
    ['[+] reduced motion', mm('(prefers-reduced-motion: reduce)') ? 'on' : 'off', false],
    ['[+] pointer', mm('(pointer: fine)') ? 'fine (mouse/trackpad)' : 'coarse (touch)', false],
    ['[+] cpu cores', String(nav.hardwareConcurrency || 'hidden'), false],
    ['[+] device memory', nav.deviceMemory ? nav.deviceMemory + ' GB' : 'hidden', false],
    ['[+] touch points', String(nav.maxTouchPoints || 0), false],
    ['[+] gpu vendor', glVendor(), true],
    ['[+] gpu', gpu(), true],
    ['[+] online', nav.onLine ? 'connected' : 'offline', false],
    ['[+] pdf viewer', nav.pdfViewerEnabled ? 'enabled' : 'disabled', false],
    ['[+] do not track', nav.doNotTrack === '1' ? 'on' : 'off — you are trackable', nav.doNotTrack !== '1'],
    ['[+] cookies', nav.cookieEnabled ? 'enabled' : 'disabled', false],
    ['[!] canvas fingerprint', canvasFingerprint(), true],
  ]
  if (nav.connection && nav.connection.effectiveType) {
    const c = nav.connection
    seq.splice(20, 0, [
      '[+] connection',
      c.effectiveType + ' · ~' + (c.downlink || '?') + ' Mbps · ' + (c.rtt != null ? c.rtt + 'ms rtt' : '?') +
        (c.saveData ? ' · data-saver on' : ''),
      false,
    ])
  }
  return seq
}

// Async signals that need a Promise (battery, storage budget, A/V inputs).
// Each appends a row when it resolves; failures are silently skipped.
async function collectAsync(row) {
  const nav = navigator
  try {
    if (nav.getBattery) {
      const b = await nav.getBattery()
      row('[+] battery', Math.round(b.level * 100) + '% · ' + (b.charging ? 'charging' : 'on battery'), false)
    }
  } catch (_) {}
  try {
    if (nav.storage && nav.storage.estimate) {
      const e = await nav.storage.estimate()
      if (e.quota) row('[+] storage budget', Math.round(e.quota / 1048576) + ' MB available to this site', false)
    }
  } catch (_) {}
  try {
    if (nav.mediaDevices && nav.mediaDevices.enumerateDevices) {
      const devs = await nav.mediaDevices.enumerateDevices()
      const cams = devs.filter((d) => d.kind === 'videoinput').length
      const mics = devs.filter((d) => d.kind === 'audioinput').length
      row('[!] media inputs', cams + ' camera(s), ' + mics + ' microphone(s) detected', true)
    }
  } catch (_) {}
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
      end.textContent = '> scan complete · ' + body.querySelectorAll('.row').length + ' attributes exposed'
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
      collectAsync(row).then(ipLookup)
    }
  }
  step()
}
