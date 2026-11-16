import type { Candidate } from "@/lib/election";

/** Foto paslon 3:4. Tanpa foto, tampil kotak bertekstur berlabel FOTO. */
export function Photo({ c, className = "" }: { c: Pick<Candidate, "photo_url" | "president_name" | "vice_name">; className?: string }) {
  if (!c.photo_url) return <div className={`ph empty ${className}`} aria-hidden="true" />;
  return (
    <div className={`ph ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.photo_url} alt={`${c.president_name} & ${c.vice_name}`} loading="lazy" />
    </div>
  );
}
