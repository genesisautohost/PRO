import { useEffect, useRef, useState } from 'react'

/**
 * igloo.inc-style scroll-scrubbed video — robust on desktop AND phone.
 *
 * The stage is held in view with CSS `position: sticky` (NOT GSAP pinning,
 * which miscalculates against mobile browser toolbars and can blank the page).
 * A lightweight rAF loop maps the track's scroll progress to video.currentTime,
 * eased — scroll down advances, scroll up rewinds, on every device.
 *
 * iOS only renders seeked frames after a muted play()/pause() inside a user
 * gesture, so we prime it on first touch/click.
 *
 * EDIT:VIDEOS — set `src` to your clip in /public/media.
 */
export default function ScrollVideo({
  src,
  poster,
  kicker,
  title,
  sub,
  scrollVh = 350,
}) {
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const hasVideo = src && !failed

  useEffect(() => {
    const track = trackRef.current
    const video = videoRef.current
    if (!track) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let current = 0

    // iOS: unlock frame-seeking with a muted play/pause in a user gesture.
    const prime = () => {
      if (!video) return
      const p = video.play()
      if (p && p.then) p.then(() => video.pause()).catch(() => {})
    }
    window.addEventListener('touchstart', prime, { once: true, passive: true })
    window.addEventListener('click', prime, { once: true })

    const onErr = () => setFailed(true)
    if (video) video.addEventListener('error', onErr, { once: true })

    const loop = () => {
      if (video && video.duration) {
        const span = track.offsetHeight - window.innerHeight
        const rect = track.getBoundingClientRect()
        let progress = span > 0 ? -rect.top / span : 0
        progress = Math.max(0, Math.min(1, progress))
        const targetT = progress * video.duration
        current += (targetT - current) * (reduced ? 1 : 0.2)
        if (Math.abs(video.currentTime - current) > 0.01) {
          try {
            video.currentTime = current
          } catch (_) {}
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', prime)
      window.removeEventListener('click', prime)
      if (video) video.removeEventListener('error', onErr)
    }
  }, [hasVideo, src])

  return (
    <section
      className="scrollvideo"
      data-section
      ref={trackRef}
      style={{ height: `${scrollVh}vh` }}
    >
      <div className="sv-stage">
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
