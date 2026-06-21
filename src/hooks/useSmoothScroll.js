import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAppStore, scrollState } from '../store/useAppStore'

gsap.registerPlugin(ScrollTrigger)

/**
 * Boots Lenis smooth scrolling and bridges it to GSAP ScrollTrigger and the
 * app store. Returns nothing — it's a side-effect engine mounted once.
 */
export function useSmoothScroll() {
  const setScroll = useAppStore((s) => s.setScroll)
  const setSection = useAppStore((s) => s.setSection)
  const setPointer = useAppStore((s) => s.setPointer)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
      syncTouch: false,
    })

    // Feed Lenis through GSAP's ticker so ScrollTrigger and Lenis share a clock.
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    lenis.on('scroll', ({ scroll, limit }) => {
      const p = limit > 0 ? Math.min(scroll / limit, 1) : 0
      scrollState.scroll = p
      setScroll(p)
    })

    // Pointer parallax (written to the plain mirror for the 3D hot path).
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      scrollState.px = x
      scrollState.py = y
      setPointer(x, y)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // Track which section owns the viewport → drives 3D scene morph.
    const sections = gsap.utils.toArray('[data-section]')
    const triggers = sections.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) {
            scrollState.section = i
            setSection(i)
          }
        },
      })
    )

    // Generic scroll-reveal for anything marked .reveal
    const reveals = gsap.utils.toArray('.reveal')
    const revealTriggers = reveals.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('in'),
      })
    )

    ScrollTrigger.refresh()

    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(raf)
      triggers.forEach((t) => t.kill())
      revealTriggers.forEach((t) => t.kill())
      lenis.destroy()
    }
  }, [setScroll, setSection, setPointer])
}
