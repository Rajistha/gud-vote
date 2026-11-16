import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getSettings, getStats } from "@/lib/election";
import { audit, getAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const s = await getSettings();
  if (!s.reconciled_at) return NextResponse.json({ error: "Hasil belum dikunci." }, { status: 409 });
  const st = await getStats();

  const wb = new ExcelJS.Workbook();
  wb.creator = "GUD Vote";

  const votes = wb.addWorksheet("Perolehan Suara");
  votes.columns = [
    { header: "No.", key: "no", width: 8 },
    { header: "Pasangan calon", key: "name", width: 42 },
    { header: "Suara", key: "total", width: 12 },
    { header: "Persen", key: "pct", width: 12 },
  ];
  for (const c of st.perCandidate) {
    votes.addRow({ no: c.number, name: `${c.president_name} & ${c.vice_name}`, total: c.total, pct: st.votes ? c.total / st.votes : 0 });
  }
  if (st.blank > 0) votes.addRow({ no: "-", name: "Kotak kosong", total: st.blank, pct: st.votes ? st.blank / st.votes : 0 });
  votes.addRow({ name: "Total suara masuk", total: st.votes });
  votes.getColumn("pct").numFmt = "0.0%";
  votes.getRow(1).font = { bold: true };

  const rec = wb.addWorksheet("Ringkasan");
  rec.columns = [{ header: "Item", key: "k", width: 36 }, { header: "Nilai", key: "v", width: 40 }];
  rec.addRows([
    { k: "Pemilihan", v: s.title },
    { k: "Jumlah anggota hak pilih", v: s.eligible_total ?? "" },
    { k: "Total suara masuk", v: st.votes },
    { k: "Catatan", v: s.reconciliation_note ?? "" },
    { k: "Dikunci", v: s.reconciled_at.toISOString() },
  ]);
  rec.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  await audit(admin.id, "EXPORT", { type: "xlsx" });
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="rekap-gud-vote.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
