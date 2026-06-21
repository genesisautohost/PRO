import { useEffect, useRef } from 'react'
import { runVisitorScan } from '../lib/visitorScan'

/** Live passive-exposure demo. Runs once when scrolled into view. */
export default function Recon() {
  const bodyRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runVisitorScan(bodyRef.current)
            obs.disconnect()
          }
        }),
      { threshold: 0.2 }
    )
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="block" id="recon" data-section ref={sectionRef}>
      <div className="label mono">recon</div>
      <p className="lead reveal">
        The second you connected, your browser <b>handed all this over</b> — no clicks, no
        permission asked.
      </p>
      <div className="terminal reveal mono">
        <div className="term-bar">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
          <span className="term-title">visitor_scan.sh</span>
        </div>
        <div className="term-body" ref={bodyRef}>
          <div className="ln">
            $ ./scan --target you<span className="cur" />
          </div>
        </div>
      </div>
      <p className="note reveal mono">
        <b>Nothing above is stored or sent anywhere</b> — it runs entirely in your browser as a
        demonstration of passive exposure. Want it gone? A VPN masks your IP, and disabling
        JavaScript kills most of the rest. This is exactly the attack surface I audit for clients.
      </p>
    </section>
  )
}
