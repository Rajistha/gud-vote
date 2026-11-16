const TZ = "Asia/Jakarta";

export function fmtDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ,
  }).format(new Date(d));
}

/** Tanggal tanpa nama hari, untuk surat resmi: "16 November 2026". */
export function fmtDateLong(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(d));
}

export function fmtTime(d: Date | string): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
    })
      .format(new Date(d))
      .replace(":", ".") + " WIB"
  );
}

export function fmtDateTime(d: Date | string): string {
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

export function fmtShort(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: TZ,
  }).format(new Date(d));
}

/** Nilai untuk <input type="datetime-local"> dalam WIB (UTC+7). */
export function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  return wib.toISOString().slice(0, 16);
}

/** Kebalikan dari toLocalInput: string WIB -> Date. */
export function fromLocalInput(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function pct(part: number, whole: number | null | undefined): string {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(1).replace(".", ",")}%`;
}
