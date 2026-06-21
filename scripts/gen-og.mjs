/**
 * Generates public/og.png — the 1200×630 social share card.
 * Run: node scripts/gen-og.mjs   (regenerate whenever the brand/tagline changes)
 */
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = resolve(__dirname, '../public/og.png')

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="28%" cy="34%" r="80%">
      <stop offset="0%" stop-color="#16202c"/>
      <stop offset="70%" stop-color="#0a0c10"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffb454" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="0" y="0" width="1200" height="630" fill="none"/>

  <!-- scanline accent top + bottom -->
  <rect x="0" y="0" width="1200" height="4" fill="#ffb454" opacity="0.8"/>
  <rect x="0" y="626" width="1200" height="4" fill="#6fb7c9" opacity="0.5"/>

  <text x="80" y="150" font-family="'JetBrains Mono', monospace" font-size="26" fill="#ffb454" letter-spacing="6">0xshikhar@re:~$ whoami</text>

  <text x="76" y="330" font-family="'JetBrains Mono', monospace" font-size="150" font-weight="700" fill="#d7dce3" letter-spacing="-4">0xshikhar</text>

  <text x="80" y="410" font-family="'JetBrains Mono', monospace" font-size="30" fill="#ffb454" letter-spacing="3">Reverse Engineer // Bug Bounty Hunter // Ethical Hacker</text>

  <text x="80" y="470" font-family="'Space Grotesk', sans-serif" font-size="26" fill="#5f6b7a">Binary RE &#183; pwn &#183; web/API &#183; mobile &#8212; offensive security in service of defense.</text>

  <text x="80" y="560" font-family="'JetBrains Mono', monospace" font-size="24" fill="#6fb7c9" letter-spacing="2">shikharmishra.com</text>
</svg>`

mkdirSync(dirname(out), { recursive: true })
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
writeFileSync(out, png)
console.log('wrote', out, png.length, 'bytes')
