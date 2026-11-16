/** Tooltip murni CSS: muncul saat hover atau fokus keyboard. Tidak butuh JavaScript. */
export function Tooltip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "right";
}) {
  return (
    <span className="tip" data-side={side}>
      {children}
      <span role="tooltip" className="tip-bubble">{text}</span>
    </span>
  );
}

/** Ikon "i" kecil dengan penjelasan. */
export function InfoTip({ text, side = "top" }: { text: string; side?: "top" | "bottom" | "right" }) {
  return (
    <Tooltip text={text} side={side}>
      <button type="button" className="info-btn" aria-label={text}>i</button>
    </Tooltip>
  );
}
