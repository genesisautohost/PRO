/* EDIT:CONTACT — links + PGP. */
const LINKS = [
  { label: 'Email', href: 'mailto:hello@shikharmishra.com' },
  { label: 'GitHub', href: '#' },
  { label: 'HackerOne', href: '#' },
  { label: 'X / Twitter', href: '#' },
]

export default function Contact() {
  return (
    <section className="block contact" data-section>
      <div className="label mono" style={{ justifyContent: 'center' }}>
        contact
      </div>
      <p className="lead reveal">
        Found something in <b>your</b> stack? Let's talk — quietly.
      </p>
      <div className="links reveal mono">
        {LINKS.map((l) => (
          <a href={l.href} key={l.label}>
            {l.label}
          </a>
        ))}
      </div>
      <div className="pgp">PGP: 0xDEADBEEF · security.txt available on request</div>
    </section>
  )
}
