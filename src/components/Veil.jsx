import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const STEPS = [
  '> initializing renderer',
  '> mapping address space',
  '> tracing control flow',
  '> resolving symbols',
  '> ready',
]

/** Boot loader. Fakes a short recon sequence, then lifts to reveal the scene. */
export default function Veil() {
  const [gone, setGone] = useState(false)
  const [line, setLine] = useState(STEPS[0])
  const barRef = useRef(null)
  const setBooted = useAppStore((s) => s.setBooted)

  useEffect(() => {
    let i = 0
    const total = STEPS.length
    const id = setInterval(() => {
      i++
      if (barRef.current) barRef.current.style.width = Math.min((i / total) * 100, 100) + '%'
      if (i < total) setLine(STEPS[i])
      else {
        clearInterval(id)
        setTimeout(() => {
          setGone(true)
          setBooted(true)
        }, 350)
      }
    }, 260)
    return () => clearInterval(id)
  }, [setBooted])

  return (
    <div className={`veil${gone ? ' gone' : ''}`} aria-hidden={gone}>
      <span className="boot mono">
        $ <b>./recon</b> --target shikharmishra.com
        <span style={{ color: 'var(--signal)', marginLeft: 8 }}>[build v19 · email-auth]</span>
      </span>
      <div className="bar">
        <i ref={barRef} />
      </div>
      <span className="boot mono" style={{ color: 'var(--steel)' }}>
        {line}
      </span>
    </div>
  )
}
