import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * igloo.inc-style scroll-scrubbed video — works on desktop AND phone.
 *
 * The clip is pinned full-screen while you scroll through a tall track; scroll
 * progress drives video.currentTime (eased per-frame). Scroll DOWN advances
 * the playhead, scroll UP rewinds it — bidirectional on every device.
 *
 * iOS only renders seeked frames once the element has been "primed" by a
 * play()/pause() inside a user gesture, so we do that on first touch/click.
 *
 * EDIT:VIDEOS — set `src` to your clip in /public/media.
 */
export default function ScrollVideo({
  src,
  poster,
  kicker,
  title,
  sub,
  scrollVh = 400,
}) {
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const hasVideo = src && !failed

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const video = videoRef.current
    if (!track || !stage) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let st
    let raf
    let target = 0
    let current = 0

    const build = (duration) => {
      try {
        st = ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          pin: stage,
          pinSpacing: true,
          scrub: true,
          onUpdate: (self) => {
            target = self.progress * (duration || 0)
          },
        })
        ScrollTrigger.refresh()
      } catch (err) {
        console.error('[ScrollVideo] trigger setup failed', err)
      }
    }

    // Ease the playhead toward the scroll target each frame → smooth scrub
    // in both directions.
    const loop = () => {
      if (video && video.duration) {
        current += (target - current) * (reduced ? 1 : 0.2)
        if (Math.abs(video.currentTime - current) > 0.01) {
          try {
            video.currentTime = current
          } catch (_) {}
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const onReady = () => {
      build(video.duration)
      try {
        video.currentTime = 0.001
      } catch (_) {}
      raf = requestAnimationFrame(loop)
    }

    // iOS: a muted play()/pause() in a user gesture unlocks frame seeking.
    const prime = () => {
      if (!video) return
      const p = video.play()
      if (p && p.then) p.then(() => video.pause()).catch(() => {})
    }
    window.addEventListener('touchstart', prime, { once: true, passive: true })
    window.addEventListener('click', prime, { once: true })

    if (hasVideo && video) {
      if (video.readyState >= 1 && video.duration) onReady()
      else video.addEventListener('loadedmetadata', onReady, { once: true })
      video.addEventListener('error', () => setFailed(true), { once: true })
    } else {
      build(0)
    }

    return () => {
      if (st) st.kill()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', prime)
      window.removeEventListener('click', prime)
      if (video) video.removeEventListener('loadedmetadata', onReady)
    }
  }, [hasVideo, src])

  return (
    <section
      className="scrollvideo"
      data-section
      ref={trackRef}
      style={{ height: `${scrollVh}vh` }}
    >
      <div className="sv-stage" ref={stageRef}>
        {hasVideo ? (
          <video
            ref={videoRef}
            className="sv-media"
            src={src}
            poster={poster}
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <>
            <div className="sv-fallback" />
            <div className="sv-grid" />
          </>
        )}

        <div className="sv-scrim" />

        <div className="sv-content">
          {kicker && <div className="sv-kicker mono">{kicker}</div>}
          {title && <h2 className="sv-title mono">{title}</h2>}
          {sub && <p className="sv-sub">{sub}</p>}
        </div>

        <div className="sv-cue mono">scroll ↕</div>
      </div>
    </section>
  )
}
