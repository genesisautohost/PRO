/* EDIT:ABOUT */
export default function About() {
  return (
    <section className="block" data-section>
      <div className="label mono">whoami</div>
      <div className="about-grid">
        <p className="lead reveal">
          I read the parts of software <b>nobody is supposed to see</b> — and report what I find,
          responsibly.
        </p>
        <div className="reveal">
          <p>
            I'm a reverse engineer and part-time bug bounty hunter working across three fronts:{' '}
            <b>binary RE &amp; pwn</b> — disassemblers, debuggers, control-flow, exploitation;{' '}
            <b>web &amp; API</b> — auth logic, access control, injection; and <b>mobile</b> —
            Android and iOS app internals.
          </p>
          <p>
            Everything here is offensive security in service of defense: coordinated disclosure,
            clean reproducible writeups, and fixes that actually ship.
          </p>
        </div>
      </div>
    </section>
  )
}
