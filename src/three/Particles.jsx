import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../store/useAppStore'

function sphericalField(count, rMin, rMax) {
  const a = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin)
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    a[i * 3] = r * Math.sin(ph) * Math.cos(th)
    a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    a[i * 3 + 2] = r * Math.cos(ph)
  }
  return a
}

/** Two drifting particle shells — far steel dust + near amber bits. */
export default function Particles({ isMobile }) {
  const far = useRef()
  const near = useRef()

  const farPos = useMemo(() => sphericalField(isMobile ? 500 : 1300, 9, 22), [isMobile])
  const nearPos = useMemo(() => sphericalField(isMobile ? 220 : 600, 4, 11), [isMobile])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (far.current) far.current.rotation.y = t * 0.01 + scrollState.px * 0.04
    if (near.current) near.current.rotation.y = t * 0.018 - scrollState.px * 0.06
  })

  return (
    <group>
      <points ref={far}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0x3a4a5a}
          size={0.03}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog
        />
      </points>
      <points ref={near}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0xffb454}
          size={0.045}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog
        />
      </points>
    </group>
  )
}
