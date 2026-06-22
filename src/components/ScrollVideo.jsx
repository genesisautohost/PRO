import { useEffect, useRef, useState } from 'react'

/**
 * igloo.inc-style scroll video — per-frame scrub on every device, stable.
 *
 * Desktop: scrub the <video> via currentTime (plenty of memory).
 * Phone:   scrub an IMAGE SEQUENCE (pre-exported JPEG frames). This is how
 *          Apple / igloo.inc do mobile scroll-scrub — no video decoder, so it
 *          can't pile up frames in memory and blank the tab. Smooth + sharp.
 *
 * Both pin the stage with CSS sticky and map scroll progress to the frame.
 *
 * EDIT:VIDEOS — `src` is the desktop clip; `frames` = { dir, count } points at
 * the exported JPEG sequence in /public/media/frames/<name>/0001.jpg ...
 */
const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820)

const pad = (n) => String(n).padStart(4, '0')

export default function ScrollVideo({
  src,
  frames,
  poster,
  kicker,
  title,
  sub,
  scrollVh = 350,
}) {
  const trackRef = useRef(null)
  const videoRef = useRef(null)
  const imgRef = useRef(null)
  const [failed, setFailed] = useState(false)

  const useFrames = IS_TOUCH && frames && frames.count
  const useVideo = !IS_TOUCH && src && !failed

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let cur = 0

    const progress = () => {
      const span = track.offsetHeight - window.innerHeight
      const rect = track.getBoundingClientRect()
      const p = span > 0 ? -rect.top / span : 0
      return Math.max(0, Math.min(1, p))
    }
    const onScreen = () => {
      const rect = track.getBoundingClientRect()
      return rect.bottom > -50 && rect.top < window.innerHeight + 50
    }

    // ---------- Phone: image-sequence scrub ----------
    if (useFrames) {
      const imgEl = imgRef.current
      let imgs = null

      const preload = () => {
        if (imgs) return
        imgs = []
        for (let i = 1; i <= frames.count; i++) {
          const im = new Image()
          im.src = `${frames.dir}/${pad(i)}.jpg`
          imgs.push(im)
        }
        if (imgEl && imgs[0]) imgEl.src = imgs[0].src
      }
      // Only fetch the frames once the section is within ~1.5 screens.
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && preload()),
        { rootMargin: '150% 0px' }
      )
      io.observe(track)

      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (!imgs || !onScreen()) return
        const target = progress() * (frames.count - 1)
        cur += (target - cur) * (reduced ? 1 : 0.3)
        const idx = Math.max(0, Math.min(frames.count - 1, Math.round(cur)))
        const s = imgs[idx] && imgs[idx].src
        if (imgEl && s && imgEl.getAttribute('src') !== s) imgEl.setAttribute('src', s)
      }
      raf = requestAnimationFrame(loop)
      return () => {
        cancelAnimationFrame(raf)
        io.disconnect()
      }
    }

    // ---------- Desktop: video scrub ----------
    const video = videoRef.current
    const onErr = () => setFailed(true)
    if (video) video.addEventListener('error', onErr, { once: true })
    const prime = () => {
      if (!video) return
      const p = video.play()
      if (p && p.then) p.then(() => video.pause()).catch(() => {})
    }
    window.addEventListener('click', prime, { once: true })

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!video || !video.duration || !onScreen()) return
      const targetT = progress() * video.duration
      cur += (targetT - cur) * (reduced ? 1 : 0.25)
      if (Math.abs(video.currentTime - cur) > 0.012) {
        try {
          video.currentTime = cur
        } catch (_) {}
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('click', prime)
      if (video) video.removeEventListener('error', onErr)
    }
  }, [useFrames, useVideo, src])

  return (
    <section
      className="scrollvideo"
      data-section
      ref={trackRef}
      style={{ height: `${scrollVh}vh` }}
    >
      <div className="sv-stage">
        {useFrames ? (
          <img ref={imgRef} className="sv-media" alt="" decoding="async" />
        ) : useVideo ? (
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
