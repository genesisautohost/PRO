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

// Live WebGL is desktop-only: running it continuously on a phone (alongside
// the scrubbed videos) exhausts GPU/memory and the browser eventually drops
// the canvas → blank screen after a while. Phones get a static background.
const isMobile =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820)

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Veil />
      {isMobile ? (
        <div className="scene-canvas scene-static" />
      ) : (
        <ErrorBoundary
          label="Scene"
          fallback={<div className="scene-canvas scene-static" />}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      )}
      <div className="atmosphere" />
      <HUD />

      <main className="content">
        <Hero />

        {/* EDIT:VIDEOS — igloo.inc-style scroll-scrubbed 3D video.
            Drop your render at public/media/scroll-3d.mp4 (or change src). */}
        <ErrorBoundary label="ScrollVideo">
          <ScrollVideo
            src="media/scroll-3d.mp4"
            frames={{ dir: 'media/frames/scroll-3d', count: 85 }}
            kicker="phase 01 // disassemble"
            title="Read the machine"
            sub="Scroll to take it apart — frame by frame, down to the instruction that breaks."
            scrollVh={220}
          />
        </ErrorBoundary>

        <Recon />
        <About />

        <ErrorBoundary label="ScrollVideo2">
          <ScrollVideo
            src="media/cinematic.mp4"
            frames={{ dir: 'media/frames/cinematic', count: 85 }}
            kicker="phase 02 // every system leaks"
            title="Find the seam"
            sub="Auth logic, access control, memory corruption — the gap is always there. I just look harder."
            scrollVh={220}
          />
        </ErrorBoundary>

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
