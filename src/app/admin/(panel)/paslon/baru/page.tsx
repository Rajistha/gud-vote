import { queryOne } from "@/lib/db";
import { getSettings, phaseOf } from "@/lib/election";
import { requireAdmin } from "@/lib/session";
import { CandidateForm } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

export default async function NewCandidate() {
  await requireAdmin();
  const s = await getSettings();
  const max = await queryOne<{ n: number | null }>("SELECT MAX(number) AS n FROM candidates");
  return (
    <>
      <div className="main-h"><h1 className="d lc">tambah <span className="mk">paslon</span></h1></div>
      <CandidateForm nextNumber={(max?.n ?? 0) + 1} locked={phaseOf(s) === "open"} />
    </>
  );
}
