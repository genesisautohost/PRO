import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * igloo.inc-style scroll video — adaptive.
 *
 * Desktop (fine pointer): the clip is pinned full-screen and scroll drives
 * video.currentTime frame-by-frame (eased for smooth scrubbing).
 *
 * Phone / touch (coarse pointer): scrubbing a multi-MB clip via currentTime
 * stutters badly on iOS, so instead the clip just autoplays muted + looped
 * full-screen (buttery, reliable) while the section scrolls normally.
 *
 * EDIT:VIDEOS — set `src` to your clip in /public/media.
 */
export default function ScrollVideo({
  src,
  poster,
  kicker,
  title,
  sub,
  scrollVh = 450,
}) {
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  // Decide mode once, before paint, so the track height is right immediately.
  const [isTouch] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820)
  )
  const hasVideo = src && !failed

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const video = videoRef.current
    if (!track || !stage) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- Phone / touch: smooth autoplay loop, no scrub, no pin ----
    if (isTouch) {
      if (hasVideo && video) {
        video.muted = true
        video.loop = true
        const tryPlay = () => video.play().catch(() => {})
        if (video.readyState >= 2) tryPlay()
        else video.addEventListener('canplay', tryPlay, { once: true })
        video.addEventListener('error', () => setFailed(true), { once: true })
        return () => video.removeEventListener('canplay', tryPlay)
      }
      return
    }

    // ---- Desktop: pin + scroll-scrub the playhead ----
    let st
    let raf
    let target = 0
    let current = 0

    const buildTrigger = (duration) => {
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
    }

    const loop = () => {
      if (video && video.duration) {
        current += (target - current) * (reduced ? 1 : 0.18)
        if (Math.abs(video.currentTime - current) > 0.01) {
          try {
            video.currentTime = current
          } catch (_) {}
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const onReady = () => {
      buildTrigger(video.duration)
      try {
        video.currentTime = 0.001
      } catch (_) {}
      raf = requestAnimationFrame(loop)
    }

    if (hasVideo && video) {
      if (video.readyState >= 1 && video.duration) onReady()
      else video.addEventListener('loadedmetadata', onReady, { once: true })
      video.addEventListener('error', () => setFailed(true), { once: true })
    } else {
      buildTrigger(0)
    }

    return () => {
      if (st) st.kill()
      if (raf) cancelAnimationFrame(raf)
      if (video) video.removeEventListener('loadedmetadata', onReady)
    }
  }, [hasVideo, src, isTouch])

  const trackHeight = isTouch ? '100vh' : `${scrollVh}vh`

  return (
    <section
      className="scrollvideo"
      data-section
      ref={trackRef}
      style={{ height: trackHeight }}
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
            preload={isTouch ? 'metadata' : 'auto'}
            autoPlay={isTouch}
            loop={isTouch}
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
          {!hasVideo && (
            <div className="sv-hint mono">
              drop your render at <b>/public/media/scroll-3d.mp4</b>
            </div>
          )}
        </div>

        {!isTouch && <div className="sv-cue mono">scroll ↓</div>}
      </div>
    </section>
  )
}
