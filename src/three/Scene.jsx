import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import ControlFlowGraph from './ControlFlowGraph'
import Particles from './Particles'
import { scrollState } from '../store/useAppStore'

/** Animated cyberspace grid floor. */
function GridFloor() {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(46, 46, 0xffb454, 0x223040)
    g.material.transparent = true
    g.material.opacity = 0.16
    g.position.y = -2.4
    return g
  }, [])
  return <primitive object={grid} />
}

/**
 * The rig owns the parallax/scroll camera move and graph rotation.
 * It reads from the plain `scrollState` mirror so there are zero React
 * re-renders on the hot path.
 */
function Rig({ children, reduced }) {
  const group = useRef()
  const { camera } = useThree()
  const cur = useRef({ mx: 0, my: 0, scroll: 0 })

  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    const c = cur.current
    c.mx += (scrollState.px - c.mx) * 0.05
    c.my += (scrollState.py - c.my) * 0.05
    c.scroll += (scrollState.scroll - c.scroll) * 0.06

    if (group.current) {
      group.current.rotation.y = (reduced ? 0 : t * 0.07) + c.mx * 0.45 + c.scroll * Math.PI * 0.8
      group.current.rotation.x = c.my * 0.28 + c.scroll * 0.4
    }

    // Dolly through the graph as the page scrolls.
    camera.position.x += (c.mx * 0.4 - camera.position.x) * 0.05
    camera.position.y += (-c.my * 0.4 + c.scroll * 0.7 - camera.position.y) * 0.05
    camera.position.z += (6.2 - c.scroll * 2.2 - camera.position.z) * 0.05
    camera.lookAt(0, 0, 0)
  })

  return <group ref={group}>{children}</group>
}

export default function Scene() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 720

  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ fov: 48, near: 0.1, far: 100, position: [0, 0, 6.2] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x0a0c10, 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        scene.fog = new THREE.FogExp2(0x0a0c10, 0.05)
      }}
    >
      <Rig reduced={reduced}>
        <GridFloor />
        <ControlFlowGraph isMobile={isMobile} />
      </Rig>

      {/* particle shells live outside the rig so they self-rotate */}
      <Particles isMobile={isMobile} />

      {!isMobile && (
        <EffectComposer disableNormalPass>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
