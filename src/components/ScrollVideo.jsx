import { useEffect, useRef, useState } from 'react'

/**
 * igloo.inc-style scroll video — per-frame scrub on every device.
 *
 * Desktop: scrub the <video> via currentTime.
 * Phone:   scrub an image sequence drawn to a <canvas>. Canvas drawImage paints
 *          each frame OVER the previous one (no clear-to-black between frames),
 *          so there's none of the flicker an <img> src-swap produces. Frames are
 *          preloaded; if the next one isn't decoded yet we keep showing the last
 *          painted frame instead of going blank. Memory-safe (no video decoder).
 *
 * EDIT:VIDEOS — `src` = desktop clip; `frames` = { dir, count } → JPEG sequence.
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
  const canvasRef = useRef(null)
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

    // ---------- Phone: image sequence on canvas (no flicker) ----------
    if (useFrames) {
      const canvas = canvasRef.current
      const ctx = canvas && canvas.getContext('2d')
      let imgs = null
      let drawn = -1

      const sizeCanvas = () => {
        if (!canvas) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.round(canvas.clientWidth * dpr)
        canvas.height = Math.round(canvas.clientHeight * dpr)
        drawn = -1 // force redraw at new size
      }

      const draw = (img) => {
        if (!ctx || !img || !img.complete || !img.naturalWidth) return false
        const cw = canvas.width
        const ch = canvas.height
        const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
        const dw = img.naturalWidth * scale
        const dh = img.naturalHeight * scale
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
        return true
      }

      const preload = () => {
        if (imgs) return
        imgs = []
        for (let i = 1; i <= frames.count; i++) {
          const im = new Image()
          im.src = `${frames.dir}/${pad(i)}.jpg`
          imgs.push(im)
        }
        // paint the first frame as soon as it's ready
        if (imgs[0]) imgs[0].onload = () => { if (drawn === -1) draw(imgs[0]) }
      }

      sizeCanvas()
      window.addEventListener('resize', sizeCanvas)
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && preload()),
        { rootMargin: '150% 0px' }
      )
      io.observe(track)

      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (!imgs || !onScreen()) return
        if (!canvas.width || !canvas.height) sizeCanvas()
        const target = progress() * (frames.count - 1)
        cur += (target - cur) * (reduced ? 1 : 0.3)
        const idx = Math.max(0, Math.min(frames.count - 1, Math.round(cur)))
        if (idx !== drawn) {
          if (draw(imgs[idx])) drawn = idx // only commit if it actually painted
        }
      }
      raf = requestAnimationFrame(loop)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', sizeCanvas)
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
          <canvas ref={canvasRef} className="sv-media" />
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
