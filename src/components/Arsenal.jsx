/* EDIT:ARSENAL — tools grouped by domain. */
const ARSENAL = [
  {
    dom: 'binary / pwn',
    tags: ['Ghidra', 'IDA Pro', 'Binary Ninja', 'radare2', 'pwndbg / GEF', 'pwntools', 'angr', 'x64dbg', 'QEMU'],
  },
  { dom: 'web / api', tags: ['Burp Suite', 'Caido', 'ffuf', 'sqlmap', 'mitmproxy', 'nuclei'] },
  { dom: 'mobile', tags: ['Frida', 'objection', 'jadx', 'apktool', 'Hopper'] },
]

export default function Arsenal() {
  return (
    <section className="block" data-section>
      <div className="label mono">arsenal</div>
      <div className="arsenal reveal">
        {ARSENAL.map((g) => (
          <div className="arsenal-row" key={g.dom}>
            <span className="dom mono">{g.dom}</span>
            <div className="tags mono">
              {g.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
