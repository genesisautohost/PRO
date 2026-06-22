import { useEffect, useRef, useState } from 'react'

/**
 * Scroll video — adaptive, sharp on both, stable on both.
 *
 * Desktop: pinned (CSS sticky) + scroll scrubs video.currentTime frame-by-frame.
 * Phone:   autoplay muted loop. Scrubbing HD video on a phone holds a growing
 *          pile of decoded full-res frames → memory crash / blank after a
 *          while; sequential playback decodes forward cheaply, so it's smooth
 *          and stable at the SAME 1080p quality. No scrub on touch, by design.
 *
 * EDIT:VIDEOS — set `src` to your clip in /public/media.
 */
const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820)

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

    const onErr = () => setFailed(true)
    if (video) video.addEventListener('error', onErr, { once: true })

    // ---- Phone: autoplay loop, no scrub (stable + sharp) ----
    if (IS_TOUCH) {
      if (video && hasVideo) {
        video.muted = true
        const tryPlay = () => {
          const p = video.play()
          if (p && p.then) p.catch(() => {})
        }
        if (video.readyState >= 2) tryPlay()
        else video.addEventListener('canplay', tryPlay, { once: true })
      }
      return () => {
        if (video) video.removeEventListener('error', onErr)
      }
    }

    // ---- Desktop: sticky pin + scroll-scrub the playhead ----
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let current = 0

    const prime = () => {
      if (!video) return
      const p = video.play()
      if (p && p.then) p.then(() => video.pause()).catch(() => {})
    }
    window.addEventListener('click', prime, { once: true })

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!video || !video.duration) return
      const rect = track.getBoundingClientRect()
      if (rect.bottom < -50 || rect.top > window.innerHeight + 50) return
      const span = track.offsetHeight - window.innerHeight
      let progress = span > 0 ? -rect.top / span : 0
      progress = Math.max(0, Math.min(1, progress))
      const targetT = progress * video.duration
      current += (targetT - current) * (reduced ? 1 : 0.25)
      if (Math.abs(video.currentTime - current) > 0.012) {
        try {
          video.currentTime = current
        } catch (_) {}
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('click', prime)
      if (video) video.removeEventListener('error', onErr)
    }
  }, [hasVideo, src])

  return (
    <section
      className="scrollvideo"
      data-section
      ref={trackRef}
      style={{ height: IS_TOUCH ? '100vh' : `${scrollVh}vh` }}
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
            autoPlay={IS_TOUCH}
            loop={IS_TOUCH}
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

        {!IS_TOUCH && <div className="sv-cue mono">scroll ↕</div>}
      </div>
    </section>
  )
}
