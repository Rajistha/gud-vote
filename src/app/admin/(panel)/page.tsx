import { getSettings, getStats, phaseOf } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { audit, requireAdmin } from "@/lib/session";
import { LiveDashboard, type LiveData } from "@/components/admin/LiveDashboard";
import { PublicLiveControl } from "@/components/admin/PublicLiveControl";

export const dynamic = "force-dynamic";

const PHASE = {
  upcoming: { cls: "chip-soon", label: "Belum Dibuka" },
  open: { cls: "chip-live", label: "Berlangsung" },
  closed: { cls: "chip-closed", label: "Ditutup" },
} as const;

export default async function Dashboard() {
  const admin = await requireAdmin();
  const [s, st] = await Promise.all([getSettings(), getStats()]);
  const phase = phaseOf(s);

  // Setiap kali dashboard dibuka dengan rincian suara tampil, akses dicatat (FR-16).
  if (s.show_live_breakdown) await audit(admin.id, "VIEW_LIVE_COUNT", { page: "dashboard" });

  const initial: LiveData = {
    phase,
    showBreakdown: s.show_live_breakdown,
    votes: st.votes,
    eligible: st.eligible,
    perCandidate: s.show_live_breakdown ? st.perCandidate : null,
    blank: s.show_live_breakdown ? st.blank : null,
  };

  return (
    <>
      <div className="main-h">
        <div>
          <small className="muted">{fmtDate(new Date())}</small>
          <h1 className="d">Halo, <span className="mk">{(admin.name ?? admin.email).split(/[@\s]/)[0].replace(/^./, (c) => c.toUpperCase())}</span></h1>
        </div>
        <div className="sp" />
        <span className={`chip ${PHASE[phase].cls}`}><span className="dot" />{PHASE[phase].label}{s.closes_at && phase === "open" ? ` · Tutup ${fmtTime(s.closes_at)}` : ""}</span>
      </div>
      <PublicLiveControl initial={s.public_live} />
      <LiveDashboard initial={initial} />
    </>
  );
}
