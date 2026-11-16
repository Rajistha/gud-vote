import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/live";

export const dynamic = "force-dynamic";

/** Data live count untuk layar publik. Hanya agregat; tanpa data pemilih. */
export async function GET() {
  try {
    const data = await getLiveSnapshot();
    return NextResponse.json(data, {
      headers: {
        // Perantara (CDN) boleh menyimpan 2 detik: ribuan penonton tidak menambah beban database.
        "Cache-Control": "public, max-age=0, s-maxage=2, stale-while-revalidate=4",
      },
    });
  } catch (e) {
    console.error("Live count gagal:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
