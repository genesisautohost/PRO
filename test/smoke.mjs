import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',
  { url: 'https://shikharmishra.com/?b=v7', pretendToBeVisual: true })
const { window } = dom
global.window = window; global.self = window
for (const k of ['document','HTMLElement','Image','Node','getComputedStyle','CSS','Event','customElements','MutationObserver','DOMParser','Blob','URL','HTMLCanvasElement','SVGElement','HTMLVideoElement','HTMLImageElement']) {
  try { global[k] = window[k] } catch (_) {}
}
window.matchMedia = (q) => ({ matches: /coarse/.test(q), media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent(){return false} })
global.matchMedia = window.matchMedia
class IO { observe(){} unobserve(){} disconnect(){} takeRecords(){return[]} }
window.IntersectionObserver = IO; global.IntersectionObserver = IO
class RO { observe(){} unobserve(){} disconnect(){} }
window.ResizeObserver = RO; global.ResizeObserver = RO
window.requestAnimationFrame = (cb)=>setTimeout(()=>cb(Date.now()),16); global.requestAnimationFrame = window.requestAnimationFrame
window.cancelAnimationFrame = (id)=>clearTimeout(id); global.cancelAnimationFrame = window.cancelAnimationFrame
try { window.HTMLMediaElement.prototype.play = ()=>Promise.resolve(); window.HTMLMediaElement.prototype.pause = ()=>{} } catch(e){}
const errors = []
window.addEventListener('error', e => errors.push('window.error: ' + (e.message||e)))
process.on('unhandledRejection', e => errors.push('unhandledRejection: ' + ((e&&e.message)||e)))
process.on('uncaughtException', e => errors.push('uncaughtException: ' + ((e&&e.message)||e)))
console.log('simulating MOBILE path (pointer:coarse = true)')
try { await import('../dist/assets/index.js') }
catch (e) { errors.push('IMPORT THREW: ' + e.message + '\n' + (e.stack||'')) }
await new Promise(r => setTimeout(r, 1800))
const root = document.getElementById('root')
console.log('--- RESULT ---')
console.log('root children count:', root.children.length)
console.log('root html length:', root.innerHTML.length)
console.log('errors:', errors.length ? '\n' + errors.join('\n---\n') : 'NONE')
console.log('snippet:', root.innerHTML.replace(/\s+/g,' ').slice(0, 300))
process.exit(0)
