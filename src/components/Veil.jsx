import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'

const STEPS = [
  '> initializing renderer',
  '> mapping address space',
  '> tracing control flow',
  '> resolving symbols',
  '> ready',
]

const STEP_MS = 300 // per boot step
const HOLD_MS = 700 // pause on "ready" before the flash (lets the bar hit 0xFF)
const FADE_MS = 1000 // matches .veil transition; unmount after

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Boot loader — WebGL edition.
 *
 * Scattered particles converge onto an amber wireframe icosahedron as the
 * boot sequence advances ("reassembling the binary"), orbited by a scanner
 * ring. A DOM terminal line + hex progress counter sit on top. On completion:
 * a quick pulse, then the veil lifts and fully unmounts (GPU freed).
 *
 * The scene is deliberately tiny (one wireframe + one Points cloud, additive
 * blending, no postprocessing) so it boots instantly even on phones; it lives
 * for ~3s total and disposes everything on unmount.
 */
export default function Veil() {
  const [gone, setGone] = useState(false)
  const [dead, setDead] = useState(false)
  const [flash, setFlash] = useState(false)
  const [line, setLine] = useState(STEPS[0])
  const barRef = useRef(null)
  const hexRef = useRef(null)
  const canvasRef = useRef(null)
  const progressRef = useRef(0) // 0..1 boot progress (stepwise target)
  const setBooted = useAppStore((s) => s.setBooted)

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- boot sequence (drives progress + copy) ----------
  useEffect(() => {
    let i = 0
    const total = STEPS.length
    const id = setInterval(() => {
      i++
      progressRef.current = Math.min(i / total, 1)
      if (i < total) setLine(STEPS[i])
      else {
        clearInterval(id)
        setLine(STEPS[total - 1])
        setTimeout(() => {
          setFlash(true)
          setTimeout(() => {
            setGone(true)
            setBooted(true)
            setTimeout(() => setDead(true), FADE_MS) // unmount → dispose GL
          }, 240)
        }, HOLD_MS)
      }
    }, STEP_MS)
    return () => clearInterval(id)
  }, [setBooted])

  // ---------- WebGL: particles reassemble a wireframe icosahedron ----------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduced) return

    const isMobile = window.innerWidth < 720
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
    } catch (err) {
      console.error('[Veil] WebGL unavailable', err)
      return
    }
    renderer.setClearColor(0x0a0c10, 1)
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
    camera.position.set(0, 0, 5.5)
    camera.lookAt(0, -0.55, 0) // shape sits above center, clear of the boot text
    const group = new THREE.Group()
    scene.add(group)
    const disposables = []

    // -- target shape: icosahedron edges --
    const icoGeo = new THREE.IcosahedronGeometry(1.35, 1)
    const edgeGeo = new THREE.EdgesGeometry(icoGeo)
    disposables.push(icoGeo, edgeGeo)
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffb454,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })
    const wire = new THREE.LineSegments(edgeGeo, wireMat)
    group.add(wire)
    disposables.push(wireMat)

    // -- glow sprite texture --
    const dotTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const x = c.getContext('2d')
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.4, 'rgba(255,180,84,0.7)')
      g.addColorStop(1, 'rgba(255,180,84,0)')
      x.fillStyle = g
      x.fillRect(0, 0, 64, 64)
      const t = new THREE.Texture(c)
      t.needsUpdate = true
      return t
    })()
    disposables.push(dotTex)

    // -- particles: scattered shell → points along the icosahedron edges --
    const COUNT = isMobile ? 550 : 1400
    const ep = edgeGeo.attributes.position.array
    const EDGES = ep.length / 6
    const starts = new Float32Array(COUNT * 3)
    const targets = new Float32Array(COUNT * 3)
    const stagger = new Float32Array(COUNT)
    const colors = new Float32Array(COUNT * 3)
    const cAmber = new THREE.Color(0xffb454)
    const cSteel = new THREE.Color(0x6fb7c9)
    const cCrit = new THREE.Color(0xff5d5d)
    for (let i = 0; i < COUNT; i++) {
      // start: random point on a wide shell
      const r = 3.5 + Math.random() * 3.5
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      starts[i * 3] = r * Math.sin(ph) * Math.cos(th)
      starts[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
      starts[i * 3 + 2] = r * Math.cos(ph)
      // target: random point along a random edge
      const k = Math.floor(Math.random() * EDGES) * 6
      const t = Math.random()
      targets[i * 3] = ep[k] + (ep[k + 3] - ep[k]) * t
      targets[i * 3 + 1] = ep[k + 1] + (ep[k + 4] - ep[k + 1]) * t
      targets[i * 3 + 2] = ep[k + 2] + (ep[k + 5] - ep[k + 2]) * t
      stagger[i] = Math.random() * 0.35
      const roll = Math.random()
      const col = roll < 0.72 ? cAmber : roll < 0.94 ? cSteel : cCrit
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    const ptsGeo = new THREE.BufferGeometry()
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(starts.slice(), 3))
    ptsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const ptsMat = new THREE.PointsMaterial({
      size: 0.05,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const pts = new THREE.Points(ptsGeo, ptsMat)
    group.add(pts)
    disposables.push(ptsGeo, ptsMat)

    // -- scanner ring --
    const ringPts = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      ringPts.push(new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0))
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts)
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x6fb7c9,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    })
    const ring = new THREE.Line(ringGeo, ringMat)
    ring.rotation.x = Math.PI * 0.42
    group.add(ring)
    disposables.push(ringGeo, ringMat)

    // -- core glow --
    const coreMat = new THREE.SpriteMaterial({
      map: dotTex,
      color: 0xffd9a0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const core = new THREE.Sprite(coreMat)
    core.scale.setScalar(0.4)
    group.add(core)
    disposables.push(coreMat)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)
    resize()

    const clock = new THREE.Clock()
    const posAttr = pts.geometry.attributes.position
    let smooth = 0
    let raf

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      smooth += (progressRef.current - smooth) * 0.12

      // particles converge (staggered so the shape knits together in waves)
      const arr = posAttr.array
      for (let i = 0; i < COUNT; i++) {
        const s = stagger[i]
        const k = easeOutCubic(Math.max(0, Math.min(1, (smooth * 1.35 - s) / (1 - s))))
        const j = i * 3
        // converged particles breathe slightly so the shape stays alive
        const wob = k > 0.98 ? Math.sin(t * 3 + i) * 0.012 : 0
        arr[j] = starts[j] + (targets[j] - starts[j]) * k + wob
        arr[j + 1] = starts[j + 1] + (targets[j + 1] - starts[j + 1]) * k + wob
        arr[j + 2] = starts[j + 2] + (targets[j + 2] - starts[j + 2]) * k
      }
      posAttr.needsUpdate = true

      // wireframe + core fade in as the shape completes
      wireMat.opacity = smooth * 0.5
      coreMat.opacity = smooth * 0.85
      core.scale.setScalar(0.4 + Math.sin(t * 2.4) * 0.06 + smooth * 0.5)

      // occasional glitch jitter while still booting
      if (smooth < 0.98 && Math.random() < 0.06) {
        group.position.x = (Math.random() - 0.5) * 0.05
        group.position.y = (Math.random() - 0.5) * 0.04
      } else {
        group.position.x *= 0.8
        group.position.y *= 0.8
      }

      group.rotation.y = t * 0.45
      group.rotation.x = Math.sin(t * 0.5) * 0.18
      ring.rotation.z = -t * 0.9

      // hex progress readout (0x00 → 0xFF)
      if (hexRef.current)
        hexRef.current.textContent =
          '0x' + Math.round(smooth * 255).toString(16).toUpperCase().padStart(2, '0')
      if (barRef.current) barRef.current.style.width = (smooth * 100).toFixed(1) + '%'

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => d.dispose && d.dispose())
      renderer.dispose()
    }
  }, [reduced])

  // reduced-motion fallback: no WebGL, just tick the bar with the steps
  useEffect(() => {
    if (!reduced) return
    let i = 0
    const id = setInterval(() => {
      i++
      if (barRef.current)
        barRef.current.style.width = Math.min((i / STEPS.length) * 100, 100) + '%'
      if (i >= STEPS.length) clearInterval(id)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [reduced])

  if (dead) return null

  return (
    <div className={`veil${gone ? ' gone' : ''}`} aria-hidden={gone}>
      {!reduced && <canvas className="veil-canvas" ref={canvasRef} />}
      <div className="veil-ui">
        <span className="boot mono">
          $ <b>./boot</b> --target shikharmishra.com
        </span>
        <div className="bar">
          <i ref={barRef} />
        </div>
        <div className="veil-meta mono">
          <span className="boot">{line}</span>
          <span className="veil-hex" ref={hexRef}>
            0x00
          </span>
        </div>
      </div>
      <div className={`veil-flash${flash ? ' on' : ''}`} />
    </div>
  )
}
