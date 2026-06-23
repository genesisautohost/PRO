/* EDIT:FINDINGS — swap in real CVEs / writeups + their links.
   These are SAMPLE entries (placeholder IDs) shown as a layout demo.
   Replace `id` with real CVE IDs (auto-links to NVD) and set `href`, then
   remove `sample: true` so the "sample" tag disappears. */
const FINDINGS = [
  { id: 'CVE-20XX-NNNNN', desc: 'Heap overflow in media parser', vendor: 'Vendor A', sev: 'crit', sevLabel: 'Critical', sample: true, href: '#' },
  { id: 'CVE-20XX-NNNNN', desc: 'Auth bypass via path traversal', vendor: 'Vendor B', sev: 'high', sevLabel: 'High', sample: true, href: '#' },
  { id: 'HOF-20XX', desc: 'IDOR in account API', vendor: 'Bug Bounty', sev: 'high', sevLabel: 'High', sample: true, href: '#' },
  { id: 'WRITEUP', desc: 'Unpacking a custom VM-protected binary', vendor: 'Blog', sev: 'med', sevLabel: 'Research', sample: true, href: '#' },
]

// Real CVE IDs link straight to the public NVD record (verifiable proof).
const nvd = (id) => /^CVE-\d{4}-\d+$/.test(id)
  ? `https://nvd.nist.gov/vuln/detail/${id}` : null

export default function Findings() {
  return (
    <section className="block" data-section>
      <div className="label mono">
        findings <span className="sample-tag">sample</span>
      </div>
      <div>
        {FINDINGS.map((f, i) => {
          const link = nvd(f.id) || f.href
          return (
            <a
              className="finding reveal"
              href={link}
              key={i}
              target={nvd(f.id) ? '_blank' : undefined}
              rel={nvd(f.id) ? 'noopener noreferrer' : undefined}
              onClick={(e) => f.sample && link === '#' && e.preventDefault()}
            >
              <span className="id">{f.id}</span>
              <span className="desc">{f.desc}</span>
              <span className="vendor">{f.vendor}</span>
              <span className={`sev ${f.sev}`}>{f.sevLabel}</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
