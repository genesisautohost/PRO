import { useEffect, useRef } from 'react'
import { scrollState } from '../store/useAppStore'

const hex = (v) =>
  '0x' + (Math.abs(Math.round(v * 4096)) & 0xffff).toString(16).toUpperCase().padStart(4, '0')

/** Corner terminal HUD. Updates via rAF + refs — never re-renders React. */
export default function HUD() {
  const mx = useRef(null)
  const my = useRef(null)
  const sp = useRef(null)
  const rail = useRef(null)

  useEffect(() => {
    let raf
    const loop = () => {
      if (mx.current) mx.current.textContent = hex(scrollState.px)
      if (my.current) my.current.textContent = hex(scrollState.py)
      if (sp.current)
        sp.current.textContent =
          '0x' + Math.round(scrollState.scroll * 0xffff).toString(16).toUpperCase().padStart(4, '0')
      if (rail.current) rail.current.style.width = (scrollState.scroll * 100).toFixed(2) + '%'
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div className="progress-rail" ref={rail} />
      <div className="hud tl mono">0xshikhar@re:~$ whoami</div>
      <div className="hud tr mono">
        STATUS <span className="ok">ONLINE</span>
        <br />
        NODE 0x1A
      </div>
      <div className="hud bl mono">
        PTR <span className="live" ref={mx}>0x0000</span>{' '}
        <span className="live" ref={my}>0x0000</span>
      </div>
      <div className="hud br mono">
        OFFSET <span className="live" ref={sp}>0x0000</span>
      </div>
    </>
  )
}
