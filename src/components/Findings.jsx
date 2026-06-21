/* EDIT:FINDINGS — swap in real CVEs / writeups + their links. */
const FINDINGS = [
  { id: 'CVE-2025-0000', desc: 'Heap overflow in media parser', vendor: 'Vendor A', sev: 'crit', sevLabel: 'Critical', href: '#' },
  { id: 'CVE-2024-0000', desc: 'Auth bypass via path traversal', vendor: 'Vendor B', sev: 'high', sevLabel: 'High', href: '#' },
  { id: 'HOF-2024', desc: 'IDOR in account API', vendor: 'Bug Bounty', sev: 'high', sevLabel: 'High', href: '#' },
  { id: 'WRITEUP', desc: 'Unpacking a custom VM-protected binary', vendor: 'Blog', sev: 'med', sevLabel: 'Research', href: '#' },
]

export default function Findings() {
  return (
    <section className="block" data-section>
      <div className="label mono">findings</div>
      <div>
        {FINDINGS.map((f) => (
          <a className="finding reveal" href={f.href} key={f.id}>
            <span className="id">{f.id}</span>
            <span className="desc">{f.desc}</span>
            <span className="vendor">{f.vendor}</span>
            <span className={`sev ${f.sev}`}>{f.sevLabel}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
