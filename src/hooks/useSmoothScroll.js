import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAppStore, scrollState } from '../store/useAppStore'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll engine.
 *
 * Desktop: Lenis smooth scroll, bridged to GSAP ScrollTrigger.
 * Touch / phone: NO Lenis — native scrolling so the page scrolls freely both
 * directions (Lenis touch-hijacking is the usual cause of "can't scroll on
 * mobile"). ScrollTrigger drives pins/scrubs off native scroll on its own.
 * Either way we mirror scroll progress into scrollState for the 3D + HUD.
 */
export function useSmoothScroll() {
  const setScroll = useAppStore((s) => s.setScroll)
  const setSection = useAppStore((s) => s.setSection)
  const setPointer = useAppStore((s) => s.setPointer)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820
    const useLenis = !isTouch && !reduced

    const cleanups = []

    const setProgress = (scroll, limit) => {
      const p = limit > 0 ? Math.min(scroll / limit, 1) : 0
      scrollState.scroll = p
      setScroll(p)
    }

    if (useLenis) {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      lenis.on('scroll', ({ scroll, limit }) => setProgress(scroll, limit))
      cleanups.push(() => {
        gsap.ticker.remove(raf)
        lenis.destroy()
      })
    } else {
      // Native scroll (touch / reduced-motion). ScrollTrigger handles pins on
      // its own; we just mirror progress for the 3D scene + HUD.
      const onScroll = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight
        setProgress(window.scrollY || window.pageYOffset || 0, limit)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      scrollState.px = x
      scrollState.py = y
      setPointer(x, y)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    cleanups.push(() => window.removeEventListener('pointermove', onMove))

    const sectionTriggers = gsap.utils.toArray('[data-section]').map((el, i) =>
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

    const revealTriggers = gsap.utils.toArray('.reveal').map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('in'),
      })
    )

    ScrollTrigger.refresh()

    return () => {
      cleanups.forEach((fn) => fn())
      sectionTriggers.forEach((t) => t.kill())
      revealTriggers.forEach((t) => t.kill())
    }
  }, [setScroll, setSection, setPointer])
}
