import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType, BorderStyle, Document, Header, HorizontalPositionRelativeFrom, ImageRun, Packer, Paragraph, ShadingType,
  HeightRule, Table, TableCell, TableRow, TextRun, TextWrappingType, VerticalAlign, VerticalPositionRelativeFrom, WidthType,
} from "docx";
import { NextResponse } from "next/server";
import { buildBeritaAcara } from "@/lib/berita-acara";
import { getSettings, getStats } from "@/lib/election";
import { audit, getAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FONT = "Noto Sans JP";
const MM = 56.6929; // 1 mm dalam twip (1/20 pt)
const mm = (n: number) => Math.round(n * MM);
const BODY_W = mm(210 - 40); // lebar isi (margin kiri/kanan 20 mm)

const run = (text: string, o: { bold?: boolean; size?: number; underline?: boolean } = {}) =>
  new TextRun({ text, font: FONT, size: o.size ?? 21, bold: o.bold, underline: o.underline ? {} : undefined });

const para = (children: TextRun[], o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; indent?: boolean; keepNext?: boolean } = {}) =>
  new Paragraph({
    children,
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 140, line: 340 },
    indent: o.indent ? { firstLine: mm(12.5) } : undefined,
    keepNext: o.keepNext,
  });

const line = { style: BorderStyle.SINGLE, size: 6, color: "111111" };
const borders = { top: line, bottom: line, left: line, right: line };

function cell(text: string, w: number, o: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; fill?: string; span?: number } = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    columnSpan: o.span,
    borders,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 140, right: 140 },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
    children: [new Paragraph({ alignment: o.align ?? AlignmentType.LEFT, spacing: { after: 0 }, children: [run(text, { bold: o.bold, size: 20 })] })],
  });
}

/** Unduhan berita acara dalam format Word, memakai kop surat yang sama dengan halaman cetak. */
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const s = await getSettings();
  if (!s.reconciled_at) return NextResponse.json({ error: "Hasil belum dikunci." }, { status: 409 });
  const st = await getStats();
  const ba = buildBeritaAcara(s, st);
  await audit(admin.id, "EXPORT", { type: "berita-acara-docx" });

  const kop = await readFile(path.join(process.cwd(), "public", "kop-surat.jpeg"));
  const ttd = await readFile(path.join(process.cwd(), "public", "ttd-presiden.png"));
  const A4_W = Math.round(210 * 3.7795), A4_H = Math.round(297 * 3.7795); // piksel pada 96 dpi

  // Kop surat (header, footer, dan watermark) dipasang sebagai gambar satu halaman di belakang teks.
  const header = new Header({
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new ImageRun({
            type: "jpg",
            data: kop,
            transformation: { width: A4_W, height: A4_H },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
              behindDocument: true,
              wrap: { type: TextWrappingType.NONE },
            },
          }),
        ],
      }),
    ],
  });

  const colsKv = [Math.round(BODY_W * 0.64), BODY_W - Math.round(BODY_W * 0.64)];
  const colsRows = [Math.round(BODY_W * 0.1), 0, Math.round(BODY_W * 0.16), Math.round(BODY_W * 0.16)];
  colsRows[1] = BODY_W - colsRows[0] - colsRows[2] - colsRows[3];

  const kv = new Table({
    width: { size: BODY_W, type: WidthType.DXA },
    columnWidths: colsKv,
    rows: ba.voters.map(([k, v]) => new TableRow({ height: { value: mm(10), rule: HeightRule.ATLEAST }, children: [cell(k, colsKv[0]), cell(v, colsKv[1], { bold: true, align: AlignmentType.RIGHT })] })),
  });

  const head = (t: string, w: number) => cell(t, w, { bold: true, align: AlignmentType.CENTER, fill: "ECE9F7" });
  const votes = new Table({
    width: { size: BODY_W, type: WidthType.DXA },
    columnWidths: colsRows,
    rows: [
      new TableRow({ tableHeader: true, height: { value: mm(10), rule: HeightRule.ATLEAST }, children: [head("No.", colsRows[0]), head("Pasangan Calon", colsRows[1]), head("Suara", colsRows[2]), head("Persentase", colsRows[3])] }),
      ...ba.rows.map((r) => new TableRow({
        height: { value: mm(9), rule: HeightRule.ATLEAST },
        children: [
          cell(r.no, colsRows[0], { align: AlignmentType.CENTER }), cell(r.name, colsRows[1]),
          cell(r.votes, colsRows[2], { align: AlignmentType.RIGHT }), cell(r.pct, colsRows[3], { align: AlignmentType.RIGHT }),
        ],
      })),
      new TableRow({
        height: { value: mm(10), rule: HeightRule.ATLEAST },
        children: [
          cell("Jumlah suara masuk", colsRows[0] + colsRows[1], { bold: true, fill: "F6F4FC", span: 2 }),
          cell(ba.total.votes, colsRows[2], { bold: true, fill: "F6F4FC", align: AlignmentType.RIGHT }),
          cell(ba.total.pct, colsRows[3], { bold: true, fill: "F6F4FC", align: AlignmentType.RIGHT }),
        ],
      }),
    ],
  });

  const gap = () => new Paragraph({ spacing: { after: 100 }, children: [] });
  const SIGN_INDENT = mm(66); // blok tanda tangan di sisi kanan
  const signLine = (children: TextRun[], after = 0) =>
    new Paragraph({ alignment: AlignmentType.CENTER, indent: { left: SIGN_INDENT }, spacing: { after }, keepNext: true, children });

  const doc = new Document({
    creator: "GUD Vote",
    title: `Berita Acara ${ba.title}`,
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: { top: mm(38), bottom: mm(21), left: mm(20), right: mm(20), header: 0, footer: 0 },
          },
        },
        headers: { default: header },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [run(`BERITA ACARA ${ba.heading[0]}`.toUpperCase(), { bold: true, size: 21, underline: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 }, children: [run(ba.heading[1].toUpperCase(), { bold: true, size: 21 })] }),
          para([run(ba.opening)], { indent: true }),
          para([run("A.   DATA PEMILIH", { bold: true, size: 21 })], { align: AlignmentType.LEFT, before: 120, after: 80, keepNext: true }),
          kv,
          para([run("B.   PEROLEHAN SUARA", { bold: true, size: 21 })], { align: AlignmentType.LEFT, before: 200, after: 80, keepNext: true }),
          votes,
          gap(),
          ...(ba.leaderText ? [para([run(ba.leaderText)], { indent: true })] : []),
          ...(ba.note ? [para([run("Catatan: ", { bold: true }), run(ba.note)], { indent: true })] : []),
          para([run(ba.closing)], { indent: true }),
          new Paragraph({ spacing: { after: 0 }, children: [] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, keepNext: true, children: [run(ba.signDate)] }),
          signLine([run(ba.presidentTitle, { bold: true })], 40),
          new Paragraph({
            alignment: AlignmentType.CENTER, indent: { left: SIGN_INDENT }, spacing: { after: 0 }, keepNext: true,
            children: [new ImageRun({ type: "png", data: ttd, transformation: { width: Math.round(98 * (560 / 367)), height: 98 } })],
          }),
          signLine([run(ba.president, { bold: true, underline: true })]),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="berita-acara.docx"',
      "Cache-Control": "no-store",
    },
  });
}
