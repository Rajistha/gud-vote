import { NextResponse } from "next/server";
import { getSettings, getStats, phaseOf } from "@/lib/election";
import { getAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [s, stats] = await Promise.all([getSettings(), getStats()]);
  return NextResponse.json(
    {
      phase: phaseOf(s),
      showBreakdown: s.show_live_breakdown,
      votes: stats.votes,
      eligible: stats.eligible,
      // Rincian per paslon hanya dikirim bila panitia mengizinkan.
      perCandidate: s.show_live_breakdown ? stats.perCandidate : null,
      blank: s.show_live_breakdown ? stats.blank : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
