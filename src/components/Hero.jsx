const DOMAINS = ['binary_re', 'pwn', 'web', 'api', 'mobile']

const STATS = [
  { n: '14+', k: 'CVEs' },
  { n: '$25k+', k: 'Bounties' },
  { n: '40+', k: 'Disclosures' },
  { n: '2019', k: 'Since' },
]

/* EDIT:HERO — handle / name / role / tagline live here. */
export default function Hero() {
  return (
    <header className="hero" data-section>
      <div className="prompt mono">
        $ ./whoami<span className="cur" />
      </div>
      <h1 className="glitch" data-text="0xshikhar">
        0xshikhar
      </h1>
      <div className="role mono">
        Reverse Engineer <b>//</b> Bug Bounty Hunter <b>//</b> Ethical Hacker
      </div>
      <div className="domains mono">
        {DOMAINS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <p className="tagline">
        I take systems apart — binaries, web stacks, mobile apps — to understand how they break,
        then help close the gap before anyone else finds it.
      </p>

      {/* EDIT:STATS */}
      <div className="stats mono">
        {STATS.map((s) => (
          <div className="stat" key={s.k}>
            <div className="n">{s.n}</div>
            <div className="k">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="scroll-cue mono">scroll</div>
    </header>
  )
}
