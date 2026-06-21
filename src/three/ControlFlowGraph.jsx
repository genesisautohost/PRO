import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SIGNAL = 0xffb454
const CRIT = 0xff5d5d

function buildGraph(nodeCount, isMobile) {
  const pts = []
  for (let i = 0; i < nodeCount; i++) {
    pts.push(
      new THREE.Vector3(
        (Math.random() * 2 - 1) * 2.6,
        (Math.random() * 2 - 1) * 1.7,
        (Math.random() * 2 - 1) * 2.6
      )
    )
  }

  const amber = []
  const red = []
  const edges = []
  for (let i = 1; i < nodeCount; i++) {
    const j = Math.floor(Math.random() * i) // tree backbone
    const tainted = Math.random() < 0.16
    ;(tainted ? red : amber).push(
      pts[i].x, pts[i].y, pts[i].z,
      pts[j].x, pts[j].y, pts[j].z
    )
    edges.push([pts[i], pts[j], tainted])
  }
  const cross = isMobile ? 5 : 10
  for (let k = 0; k < cross; k++) {
    const a = Math.floor(Math.random() * nodeCount)
    const b = Math.floor(Math.random() * nodeCount)
    if (a === b) continue
    amber.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z)
    edges.push([pts[a], pts[b], false])
  }
  return { pts, amber: new Float32Array(amber), red: new Float32Array(red), edges }
}

function makeDotTexture() {
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
}

function makeLabelTexture(txt) {
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
  return t
}

export default function ControlFlowGraph({ isMobile }) {
  const nodeCount = isMobile ? 16 : 30
  const { pts, amber, red, edges } = useMemo(
    () => buildGraph(nodeCount, isMobile),
    [nodeCount, isMobile]
  )

  const dotTex = useMemo(makeDotTexture, [])
  const nodesRef = useRef()
  const packetRefs = useRef([])

  const packets = useMemo(() => {
    const count = isMobile ? 6 : 14
    return Array.from({ length: count }, () => ({
      e: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      sp: 0.004 + Math.random() * 0.01,
    }))
  }, [edges.length, isMobile])

  const labels = useMemo(() => {
    const count = isMobile ? 3 : 6
    return Array.from({ length: count }, () => {
      const p = pts[Math.floor(Math.random() * pts.length)]
      const txt = '0x' + Math.floor(0x400000 + Math.random() * 0xfffff).toString(16).toUpperCase()
      return { pos: p.clone().add(new THREE.Vector3(0.22, 0.16, 0)), tex: makeLabelTexture(txt) }
    })
  }, [pts, isMobile])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (nodesRef.current) {
      nodesRef.current.children.forEach((n, i) => {
        n.rotation.y += 0.01
        n.rotation.x += 0.006
        n.scale.setScalar(1 + 0.3 * Math.sin(t * 2 + i))
      })
    }
    packets.forEach((pk, i) => {
      pk.t += pk.sp
      if (pk.t > 1) {
        pk.t = 0
        pk.e = Math.floor(Math.random() * edges.length)
      }
      const e = edges[pk.e]
      tmp.copy(e[0]).lerp(e[1], pk.t)
      const s = packetRefs.current[i]
      if (s) {
        s.position.copy(tmp)
        s.material.color.set(e[2] ? 0xff8a8a : 0xffd9a0)
      }
    })
  })

  return (
    <group>
      {/* nodes */}
      <group ref={nodesRef}>
        {pts.map((p, i) => (
          <mesh key={i} position={p} rotation={[Math.random(), Math.random(), 0]}>
            <boxGeometry args={[0.13, 0.08, 0.03]} />
            <meshBasicMaterial color={SIGNAL} />
          </mesh>
        ))}
      </group>

      {/* amber edges */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[amber, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={SIGNAL}
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* tainted (red) edges */}
      {red.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[red, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={CRIT}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* data packets */}
      {packets.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => (packetRefs.current[i] = el)}
          scale={[0.16, 0.16, 0.16]}
        >
          <spriteMaterial
            map={dotTex}
            color={0xffd9a0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
          />
        </sprite>
      ))}

      {/* floating hex address labels */}
      {labels.map((l, i) => (
        <sprite key={i} position={l.pos} scale={[0.9, 0.225, 1]}>
          <spriteMaterial map={l.tex} transparent depthWrite={false} depthTest={false} opacity={0.85} />
        </sprite>
      ))}
    </group>
  )
}
