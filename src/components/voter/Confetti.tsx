/** Konfeti dekoratif yang jatuh perlahan. Posisi tetap agar hasil render server dan klien sama. */
const COLORS = ["#ffd84a", "#00a0a8", "#a6378f", "#fff6ef", "#f58a5c"];
const PIECES = Array.from({ length: 16 }, (_, i) => ({
  k: i % 3, x: (i * 37 + 8) % 96, d: ((i * 7) % 9) / 3, s: 5 + ((i * 5) % 6), c: COLORS[i % COLORS.length],
}));

export function Confetti() {
  return (
    <div className="ok-confetti" aria-hidden="true">
      {PIECES.map((c, i) => (
        <i key={i} className={`cf cf-${c.k}`} style={{ "--x": `${c.x}%`, "--d": `${c.d}s`, "--s": `${c.s}s`, "--c": c.c } as React.CSSProperties} />
      ))}
    </div>
  );
}
