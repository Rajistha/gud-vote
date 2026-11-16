"use client";

export function PrintButton() {
  return <button className="btn btn-p btn-sm no-print" onClick={() => window.print()}>Cetak / simpan PDF</button>;
}
