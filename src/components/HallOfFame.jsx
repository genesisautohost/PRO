/* EDIT:HALL-OF-FAME — replace SAMPLE entries with your real, verifiable
   acknowledgments. For each, set `href` to the company's public hall-of-fame
   / acknowledgment page that actually lists you, and remove `sample: true`.
   A real, linkable entry is far stronger proof than any document. */
const HOF = [
  { org: 'Google',            note: 'Vulnerability Reward Program',      year: '2024', sample: true, href: '#' },
  { org: 'Microsoft',         note: 'MSRC Researcher Acknowledgments',   year: '2024', sample: true, href: '#' },
  { org: 'Apple',             note: 'Security Acknowledgments',          year: '2023', sample: true, href: '#' },
  { org: 'Meta',              note: 'Whitehat / Bug Bounty',             year: '2023', sample: true, href: '#' },
  { org: 'Mozilla',           note: 'Security Bug Bounty Hall of Fame',  year: '2022', sample: true, href: '#' },
  { org: 'GitHub',            note: 'Security Bug Bounty',               year: '2022', sample: true, href: '#' },
]

export default function HallOfFame() {
  return (
    <section className="block" id="hall-of-fame" data-section>
      <div className="label mono">
        hall of fame <span className="sample-tag">sample</span>
      </div>

      <p className="hof-disclaimer mono reveal">
        // Demo layout. These are <b>placeholder</b> entries, not verified
        acknowledgments — swap in real hall-of-fame links before treating them as proof.
      </p>

      <div className="hof-grid">
        {HOF.map((h) => (
          <a
            className="hof-card reveal"
            href={h.href}
            key={h.org}
            onClick={(e) => h.sample && e.preventDefault()}
          >
            <div className="hof-org">{h.org}</div>
            <div className="hof-note mono">{h.note}</div>
            <div className="hof-foot mono">
              <span className="hof-year">{h.year}</span>
              {h.sample && <span className="sample-pill">sample · unverified</span>}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
