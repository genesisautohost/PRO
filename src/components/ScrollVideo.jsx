import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * igloo.inc-style scroll-scrubbed video.
 *
 * A full-screen <video> is pinned while you scroll through a tall track; the
 * scroll progress drives video.currentTime (eased per-frame for buttery
 * scrubbing). No autoplay — the scroll IS the playhead. Works on mobile
 * because it's just a muted, inline, pre-rendered clip being seeked.
 *
 * EDIT:VIDEOS — set `src` to your rendered clip in /public/media.
 *   <ScrollVideo src="/media/scroll-3d.mp4" ... />
 *
 * @param scrollVh  height of the scroll track in vh (more = slower scrub)
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
  const hasVideo = src && !failed

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const video = videoRef.current

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

    // Ease the playhead toward the scroll target every frame → smooth scrub.
    const loop = () => {
      if (video && video.duration) {
        current += (target - current) * (reduced ? 1 : 0.18)
        if (Math.abs(video.currentTime - current) > 0.01) {
          try {
            video.currentTime = current
          } catch (_) {
            /* seeking before ready — ignore */
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const onReady = () => {
      buildTrigger(video.duration)
      // Nudge the first frame to paint (iOS shows poster otherwise).
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
      // No clip yet: still pin the fallback stage so the section reads right.
      buildTrigger(0)
    }

    return () => {
      if (st) st.kill()
      if (raf) cancelAnimationFrame(raf)
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
            // No autoplay/loop — scroll drives the playhead.
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
              drop your render at <b>/public/media/scroll-3d.mp4</b> · scroll scrubs it
            </div>
          )}
        </div>

        <div className="sv-cue mono">scroll ↓</div>
      </div>
    </section>
  )
}
