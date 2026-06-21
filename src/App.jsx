import { useSmoothScroll } from './hooks/useSmoothScroll'
import Scene from './three/Scene'
import HUD from './components/HUD'
import Veil from './components/Veil'
import Hero from './components/Hero'
import Recon from './components/Recon'
import About from './components/About'
import Findings from './components/Findings'
import Arsenal from './components/Arsenal'
import Contact from './components/Contact'
import VideoSection from './components/VideoSection'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Veil />
      <Scene />
      <div className="atmosphere" />
      <HUD />

      <main className="content">
        <Hero />

        {/* EDIT:VIDEOS — drop a clip into /public/media and set src="/media/your.mp4" */}
        <VideoSection
          kicker="phase 01 // disassemble"
          title="Read the machine"
          sub="Binaries don't lie. I follow the control flow down to the instruction that breaks."
          // src="/media/disassemble.mp4"
        />

        <Recon />
        <About />

        <VideoSection
          kicker="phase 02 // every system leaks"
          title="Find the seam"
          sub="Auth logic, access control, memory corruption — the gap is always there. I just look harder."
          // src="/media/seam.mp4"
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
