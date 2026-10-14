import { memo, useMemo } from 'react'

// Deterministic pseudo-random numbers so the city looks the same on every visit
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const winColor = (r) => (r < 0.72 ? '#FFE52E' : r < 0.9 ? '#7FDBFF' : '#FF8CC6')

function window_(k, delay, size, forceLit = false) {
  const lit = forceLit || rnd(k) > 0.28
  return {
    key: k,
    className: lit ? (rnd(k + 3) > 0.94 ? 'win twinkle' : 'win') : undefined,
    style: { height: size, borderRadius: 1, background: 'var(--city-off)', '--c': winColor(rnd(k + 7)), animationDelay: `${delay.toFixed(2)}s` },
  }
}

function buildCity(dense) {
  const perSide = dense ? 8 : 4
  const win = dense ? 7 : 5
  const row = (left, seedBase) =>
    Array.from({ length: perSide }, (_, i) => {
      const d = left ? perSide - i : i + 1 // distance from the HQ: lights spread outwards
      const s = seedBase + i * 13
      const h = Math.round((dense ? 84 : 70) + rnd(s) * (dense ? 150 : 104) - d * (dense ? 4 : 5))
      const cols = (dense ? 3 : 2) + Math.floor(rnd(s + 1) * (dense ? 3 : 2))
      const rows = Math.max(3, Math.floor((h - 18) / (dense ? 15 : 11)))
      const windows = []
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const k = s * 100 + r * 10 + c
          windows.push(window_(k, (dense ? 1.95 : 1.85) + d * (dense ? 0.14 : 0.18) + rnd(k + 5) * 0.45, win))
        }
      }
      return {
        key: s,
        beacon: rnd(s + 9) > 0.6,
        beaconDelay: `${(rnd(s + 11) * 1.6).toFixed(2)}s`,
        style: {
          flex: `${(2 + rnd(s + 2) * 3).toFixed(2)} 1 0`,
          height: h,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: dense ? '8px 6px' : '6px 4px',
          padding: dense ? '14px 8px 0' : '10px 5px 0',
        },
        windows,
      }
    })

  const hqCols = dense ? 6 : 4
  const hqRows = dense ? 14 : 12
  const hq = []
  for (let r = 0; r < hqRows; r += 1) {
    for (let c = 0; c < hqCols; c += 1) {
      const k = 9000 + r * 10 + c
      hq.push(window_(k, 1.45 + (hqRows - 1 - r) * 0.03 + rnd(k + 5) * 0.12, win, true))
    }
  }

  const back = Array.from({ length: dense ? 14 : 7 }, (_, i) => ({
    key: i,
    style: { flex: `${(2 + rnd(600 + i) * 3).toFixed(2)} 1 0`, height: Math.round((dense ? 120 : 100) + rnd(500 + i) * (dense ? 150 : 100)) },
  }))

  return { left: row(true, 100), right: row(false, 300), hq, hqCols, back }
}

function Building({ b }) {
  return (
    <div className="relative grid min-w-0 content-start rounded-t-[3px] bg-[var(--city-bld)]" style={b.style}>
      {b.beacon && <span className="beacon" style={{ animationDelay: b.beaconDelay }} />}
      {b.windows.map((w) => <span key={w.key} className={w.className} style={w.style} />)}
    </div>
  )
}

/** Night-time city. Daystol Group HQ stands in the middle; its windows light first, then the city around it. */
function Skyline({ dense }) {
  const city = useMemo(() => buildCity(dense), [dense])
  const height = dense ? 300 : 204
  const hqW = dense ? 176 : 104
  const hqH = dense ? 286 : 196

  return (
    <div aria-hidden="true" className="relative z-[1] mx-auto max-w-[1320px] px-2.5 sm:px-7" style={{ marginTop: dense ? 88 : 72 }}>
      <div className="relative" style={{ height }}>
        <span className="beam beam-a" style={{ bottom: hqH + 10, width: dense ? 220 : 150, marginLeft: dense ? -110 : -75, height: dense ? 440 : 330 }} />
        <span className="beam beam-b" style={{ bottom: hqH + 10, width: dense ? 220 : 150, marginLeft: dense ? -110 : -75, height: dense ? 440 : 330 }} />

        <div className="parallax absolute inset-0 flex items-end gap-2.5" style={{ '--depth': -10 }}>
          {city.back.map((b) => <span key={b.key} className="rounded-t-[2px] bg-[var(--city-back)]" style={b.style} />)}
        </div>

        <div className="parallax absolute inset-0 flex items-end" style={{ '--depth': 18 }}>
          <div className="flex min-w-0 flex-1 items-end gap-1 sm:gap-1.5">
            {city.left.map((b) => <Building key={b.key} b={b} />)}
          </div>

          <div className="relative shrink-0" style={{ width: hqW, height: hqH, margin: dense ? '0 8px' : '0 5px' }}>
            <div className="hq-logo absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-2xl bg-white shadow-[0_0_30px_rgba(255,229,46,.35)]" style={{ top: dense ? -72 : -52, padding: dense ? '8px 14px' : '6px 10px' }}>
              <img src="/brand/daystol-logo.png" alt="" className="w-auto" style={{ height: dense ? 42 : 30 }} />
            </div>
            <div
              className="absolute inset-0 grid content-start rounded-t-md bg-gradient-to-b from-[#1F2858] to-[#161D44] shadow-[inset_0_0_0_1px_#2A335E]"
              style={{ gridTemplateColumns: `repeat(${city.hqCols}, minmax(0, 1fr))`, gap: dense ? '8px 7px' : '6px 5px', padding: dense ? '18px 14px 0' : '13px 10px 0' }}
            >
              {city.hq.map((w) => <span key={w.key} className={w.className} style={w.style} />)}
            </div>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-midnight px-3 py-1.5 text-[10px] font-bold text-white sm:text-xs">
              Daystol Group{dense ? ' Ltd.' : ''}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-end gap-1 sm:gap-1.5">
            {city.right.map((b) => <Building key={b.key} b={b} />)}
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-line" />
    </div>
  )
}

export default memo(Skyline)
