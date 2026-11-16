import { getSettings, phaseOf } from "@/lib/election";
import { toLocalInput } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { EmergencyPanel, SettingsForm } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

const STEPS = ["Persiapan", "Belum dibuka", "Berlangsung", "Ditutup", "Rekap"];

export default async function Jadwal() {
  await requireAdmin();
  const s = await getSettings();
  const phase = phaseOf(s);
  const cur = s.reconciled_at ? 4 : phase === "closed" ? 3 : phase === "open" ? 2 : s.opens_at ? 1 : 0;

  return (
    <>
      <div className="main-h"><h1 className="d">Jadwal <span className="mk">Pemilihan</span></h1></div>
      <div className="panel">
        <div className="timeline">
          {STEPS.map((label, i) => (
            <div key={label} className={`s ${i < cur ? "done" : i === cur ? "cur" : ""}`}>
              <div className="o">{i < cur ? "✓" : i === cur ? "●" : i + 1}</div>{label}
            </div>
          ))}
        </div>
      </div>
      <div className="g2" style={{ "--cols": "1.2fr 1fr", alignItems: "start" } as React.CSSProperties}>
        <SettingsForm
          locked={!!s.reconciled_at}
          v={{
            title: s.title,
            opens_at: toLocalInput(s.opens_at),
            closes_at: toLocalInput(s.closes_at),
            eligible_total: s.eligible_total,
            show_live_breakdown: s.show_live_breakdown,
            allow_blank: s.allow_blank,
            public_live: s.public_live,
            require_venue_code: s.require_venue_code,
            has_venue_code: !!s.venue_code_hash,
            require_device_guard: s.require_device_guard,
          }}
        />
        <EmergencyPanel locked={!!s.reconciled_at} phase={phase} />
      </div>
    </>
  );
}
