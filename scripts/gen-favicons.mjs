/**
 * Generates the full favicon set from a font-free "0x" mark:
 *   public/favicon.svg          (vector, modern browsers)
 *   public/favicon.ico          (16+32+48, legacy + address bars)
 *   public/icon-192.png         (Android / PWA)
 *   public/icon-512.png         (Android / PWA)
 *   public/apple-touch-icon.png (iOS home screen, 180x180)
 * Run: node scripts/gen-favicons.mjs
 */
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = (f) => resolve(__dirname, '../public', f)

/**
 * The mark: slashed-zero + x drawn as pure strokes (no fonts — text elements
 * don't render in favicon context), amber on the site's dark bg, with the
 * steel underline from the original design.
 * `rounded` = rounded tile corners (tab icons); square for iOS/Android which
 * apply their own masks.
 */
const makeSvg = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#141a24"/>
      <stop offset="100%" stop-color="#0a0c10"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="url(#g)"/>
  ${rounded ? '<rect x="2.5" y="2.5" width="59" height="59" rx="12" fill="none" stroke="#ffb454" stroke-opacity="0.28" stroke-width="1.5"/>' : ''}
  <!-- slashed zero -->
  <ellipse cx="21" cy="30" rx="10.5" ry="14" fill="none" stroke="#ffb454" stroke-width="5.5"/>
  <line x1="14.5" y1="39" x2="27.5" y2="21" stroke="#ffb454" stroke-width="3.6" stroke-linecap="round"/>
  <!-- x -->
  <line x1="38" y1="18" x2="55" y2="42" stroke="#ffb454" stroke-width="5.5" stroke-linecap="round"/>
  <line x1="55" y1="18" x2="38" y2="42" stroke="#ffb454" stroke-width="5.5" stroke-linecap="round"/>
  <!-- steel underline -->
  <rect x="20" y="50" width="24" height="3.5" rx="1.75" fill="#6fb7c9" fill-opacity="0.85"/>
</svg>`

const png = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()

/** Pack PNG buffers into a .ico container (PNG-in-ICO is valid since Vista). */
function pngsToIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  const entries = []
  let offset = 6 + 16 * images.length
  for (const { size, buf } of images) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0) // width
    e.writeUInt8(size >= 256 ? 0 : size, 1) // height
    e.writeUInt16LE(1, 4) // color planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    offset += buf.length
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.buf)])
}

const roundedSvg = makeSvg(true)
const squareSvg = makeSvg(false)

writeFileSync(pub('favicon.svg'), roundedSvg.trim() + '\n')
writeFileSync(
  pub('favicon.ico'),
  pngsToIco([16, 32, 48].map((size) => ({ size, buf: png(roundedSvg, size) })))
)
writeFileSync(pub('icon-192.png'), png(squareSvg, 192))
writeFileSync(pub('icon-512.png'), png(squareSvg, 512))
writeFileSync(pub('apple-touch-icon.png'), png(squareSvg, 180))

console.log('favicons written to public/: favicon.svg, favicon.ico, icon-192.png, icon-512.png, apple-touch-icon.png')
