import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { scrollState } from '../store/useAppStore'

/**
 * Self-contained vanilla three.js scene — control-flow graph, traveling
 * packets, hex labels, particle shells, scroll/pointer-driven camera.
 *
 * Deliberately NOT React-Three-Fiber: this mirrors the original proven
 * single-file build and avoids the R3F + postprocessing version chain that
 * was crashing on some devices. Glow comes from additive blending, so there's
 * no EffectComposer to fail. Reads scroll/pointer from the shared scrollState
 * mirror (written by Lenis), so it stays at 60fps with zero React renders.
 */
export default function SceneCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 720

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
    } catch (err) {
      console.error('[SceneCanvas] WebGL unavailable', err)
      return
    }

    renderer.setClearColor(0x0a0c10, 1)
    // Cap DPR hard on phones — rendering at 2-3x is the main GPU cost.
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.05)
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.set(0, 0, 6.2)
    const group = new THREE.Group()
    scene.add(group)

    const disposables = []

    // ---------- cyberspace grid floor ----------
    const grid = new THREE.GridHelper(46, 46, 0xffb454, 0x223040)
    grid.material.transparent = true
    grid.material.opacity = 0.16
    grid.position.y = -2.4
    group.add(grid)
    disposables.push(grid.geometry, grid.material)

    // ---------- control-flow graph nodes ----------
    const NODES = isMobile ? 16 : 30
    const pts = []
    for (let i = 0; i < NODES; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() * 2 - 1) * 2.6,
          (Math.random() * 2 - 1) * 1.7,
          (Math.random() * 2 - 1) * 2.6
        )
      )
    }
    const nodeGeo = new THREE.BoxGeometry(0.13, 0.08, 0.03)
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffb454 })
    disposables.push(nodeGeo, nodeMat)
    const nodes = new THREE.Group()
    pts.forEach((p) => {
      const m = new THREE.Mesh(nodeGeo, nodeMat)
      m.position.copy(p)
      m.rotation.set(Math.random(), Math.random(), 0)
      nodes.add(m)
    })
    group.add(nodes)

    // ---------- edges (amber backbone + tainted red), packets travel them ----------
    const amberPos = []
    const redPos = []
    const edges = []
    for (let i = 1; i < NODES; i++) {
      const j = Math.floor(Math.random() * i)
      const tainted = Math.random() < 0.16
      ;(tainted ? redPos : amberPos).push(
        pts[i].x, pts[i].y, pts[i].z,
        pts[j].x, pts[j].y, pts[j].z
      )
      edges.push([pts[i], pts[j], tainted])
    }
    for (let k = 0; k < (isMobile ? 5 : 10); k++) {
      const a = Math.floor(Math.random() * NODES)
      const b = Math.floor(Math.random() * NODES)
      if (a === b) continue
      amberPos.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z)
      edges.push([pts[a], pts[b], false])
    }
    const lineSeg = (arr, color, op) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3))
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending,
      })
      const l = new THREE.LineSegments(g, mat)
      group.add(l)
      disposables.push(g, mat)
    }
    lineSeg(amberPos, 0xffb454, 0.34)
    if (redPos.length) lineSeg(redPos, 0xff5d5d, 0.6)

    // ---------- glow sprite texture + data packets ----------
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

    const packets = []
    const PCOUNT = isMobile ? 6 : 14
    for (let i = 0; i < PCOUNT; i++) {
      const mat = new THREE.SpriteMaterial({
        map: dotTex,
        color: 0xffd9a0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
      const s = new THREE.Sprite(mat)
      s.scale.setScalar(0.16)
      group.add(s)
      disposables.push(mat)
      packets.push({ s, e: Math.floor(Math.random() * edges.length), t: Math.random(), sp: 0.004 + Math.random() * 0.01 })
    }

    // ---------- floating hex address labels ----------
    const labelSprite = (txt) => {
      const c = document.createElement('canvas')
      c.width = 256
      c.height = 64
      const x = c.getContext('2d')
      x.font = '600 30px "JetBrains Mono", monospace'
      x.fillStyle = 'rgba(255,180,84,0.9)'
      x.textBaseline = 'middle'
      x.fillText(txt, 6, 34)
      const t = new THREE.Texture(c)
      t.needsUpdate = true
      const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, opacity: 0.85 })
      const s = new THREE.Sprite(mat)
      s.scale.set(0.9, 0.225, 1)
      disposables.push(t, mat)
      return s
    }
    for (let i = 0; i < (isMobile ? 3 : 6); i++) {
      const p = pts[Math.floor(Math.random() * NODES)]
      const lab = labelSprite('0x' + Math.floor(0x400000 + Math.random() * 0xfffff).toString(16).toUpperCase())
      lab.position.copy(p).add(new THREE.Vector3(0.22, 0.16, 0))
      group.add(lab)
    }

    // ---------- particle shells ----------
    const field = (count, rMin, rMax, size, color, op) => {
      const a = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = rMin + Math.random() * (rMax - rMin)
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        a[i * 3] = r * Math.sin(ph) * Math.cos(th)
        a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
        a[i * 3 + 2] = r * Math.cos(ph)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(a, 3))
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: true })
      const p = new THREE.Points(g, mat)
      scene.add(p)
      disposables.push(g, mat)
      return p
    }
    const bitsFar = field(isMobile ? 260 : 1300, 9, 22, 0.03, 0x3a4a5a, 0.5)
    const bitsNear = field(isMobile ? 110 : 600, 4, 11, 0.045, 0xffb454, 0.55)

    // ---------- interaction state (eased) ----------
    let mx = 0, my = 0, scroll = 0

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)
    resize()

    // Don't crash if the GPU drops the context (tab backgrounded, memory, etc.).
    let lost = false
    const onLost = (e) => {
      e.preventDefault()
      lost = true
    }
    const onRestored = () => {
      lost = false
    }
    canvas.addEventListener('webglcontextlost', onLost, false)
    canvas.addEventListener('webglcontextrestored', onRestored, false)

    const clock = new THREE.Clock()
    const tmp = new THREE.Vector3()
    let raf
    let last = -1
    const minDelta = isMobile ? 1 / 30 : 0 // cap mobile to ~30fps

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (lost) return
      const now = clock.getElapsedTime()
      if (minDelta && now - last < minDelta) return
      last = now

      const t = reduced ? 0 : now
      mx += (scrollState.px - mx) * 0.05
      my += (scrollState.py - my) * 0.05
      scroll += (scrollState.scroll - scroll) * 0.06

      group.rotation.y = (reduced ? 0 : t * 0.07) + mx * 0.45 + scroll * Math.PI * 0.8
      group.rotation.x = my * 0.28 + scroll * 0.4

      nodes.children.forEach((n, i) => {
        n.rotation.y += 0.01
        n.rotation.x += 0.006
        n.scale.setScalar(reduced ? 1 : 1 + 0.3 * Math.sin(t * 2 + i))
      })

      packets.forEach((pk) => {
        pk.t += pk.sp
        if (pk.t > 1) {
          pk.t = 0
          pk.e = Math.floor(Math.random() * edges.length)
        }
        const e = edges[pk.e]
        tmp.copy(e[0]).lerp(e[1], pk.t)
        pk.s.position.copy(tmp)
        pk.s.material.color.set(e[2] ? 0xff8a8a : 0xffd9a0)
      })

      bitsFar.rotation.y = (reduced ? 0 : t * 0.01) + mx * 0.04
      bitsNear.rotation.y = (reduced ? 0 : t * 0.018) - mx * 0.06

      camera.position.x += (mx * 0.4 - camera.position.x) * 0.05
      camera.position.y += (-my * 0.4 + scroll * 0.7 - camera.position.y) * 0.05
      camera.position.z += (6.2 - scroll * 2.2 - camera.position.z) * 0.05
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      disposables.forEach((d) => d.dispose && d.dispose())
      renderer.dispose()
    }
  }, [])

  return <canvas id="scene" className="scene-canvas" ref={canvasRef} />
}
