import { useRef, useState } from 'react'

/**
 * Full-bleed cinematic panel, igloo.inc style.
 *
 * Pass `src` (and optional `poster`) to play a real clip. With no usable
 * source it falls back to a procedural amber-grid scrim so the layout looks
 * intentional until you drop real footage into /public/media and set src.
 *
 * EDIT:VIDEOS — replace the `src` props in App.jsx with your own files.
 */
export default function VideoSection({ src, poster, kicker, title, sub, tag = 'placeholder // swap in /public/media' }) {
  const [failed, setFailed] = useState(false)
  const videoRef = useRef(null)
  const showVideo = src && !failed

  return (
    <section className="video-block" data-section>
      {showVideo ? (
        <video
          ref={videoRef}
          className="v-media"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div className="v-fallback" />
          <div className="v-grid" />
        </>
      )}
      <div className="v-scrim" />

      <div className="v-inner reveal">
        {kicker && <div className="v-kicker">{kicker}</div>}
        <h2 className="v-title">{title}</h2>
        {sub && <p className="v-sub">{sub}</p>}
      </div>

      {!showVideo && <div className="v-tag mono">{tag}</div>}
    </section>
  )
}
