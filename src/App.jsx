import { lazy, Suspense } from 'react'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import ErrorBoundary from './components/ErrorBoundary'
import HUD from './components/HUD'
import Veil from './components/Veil'
import Hero from './components/Hero'
import Recon from './components/Recon'
import About from './components/About'
import Findings from './components/Findings'
import Arsenal from './components/Arsenal'
import Contact from './components/Contact'
import VideoSection from './components/VideoSection'
import ScrollVideo from './components/ScrollVideo'

// three.js scene is heavy; defer it so the DOM shell paints immediately.
const Scene = lazy(() => import('./three/SceneCanvas'))

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Veil />
      {/* The WebGL scene is isolated: if three.js/WebGL fails on a device,
          we fall back to a static dark canvas instead of blanking the page. */}
      <ErrorBoundary
        label="Scene"
        fallback={<div className="scene-canvas" style={{ background: 'var(--bg)' }} />}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </ErrorBoundary>
      <div className="atmosphere" />
      <HUD />

      <main className="content">
        <Hero />

        {/* EDIT:VIDEOS — igloo.inc-style scroll-scrubbed 3D video.
            Drop your render at public/media/scroll-3d.mp4 (or change src). */}
        <ErrorBoundary label="ScrollVideo">
          <ScrollVideo
            src="/media/scroll-3d.mp4"
            kicker="phase 01 // disassemble"
            title="Read the machine"
            sub="Scroll to take it apart — frame by frame, down to the instruction that breaks."
            scrollVh={350}
          />
        </ErrorBoundary>

        <Recon />
        <About />

        <VideoSection
          src="/media/cinematic.mp4"
          kicker="phase 02 // every system leaks"
          title="Find the seam"
          sub="Auth logic, access control, memory corruption — the gap is always there. I just look harder."
        />

        <Findings />
        <Arsenal />

        <VideoSection
          kicker="phase 03 // disclose"
          title="Close the gap"
          sub="Reproducible writeups, coordinated disclosure, fixes that actually ship."
          // src="/media/disclose.mp4"
        />

        <Contact />

        <footer className="mono">
          <span>0xshikhar · shikharmishra.com</span>
          <span>responsible disclosure only</span>
        </footer>
      </main>
    </>
  )
}
