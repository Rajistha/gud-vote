import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getSettings, phaseOf, type Candidate } from "@/lib/election";
import { requireAdmin } from "@/lib/session";
import { CandidateForm } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCandidate(props: PageProps<"/admin/paslon/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const c = await queryOne<Candidate>("SELECT * FROM candidates WHERE id = $1", [id]);
  if (!c) notFound();
  const s = await getSettings();
  return (
    <>
      <div className="main-h"><h1 className="d">Edit <span className="mk">Paslon {c.number}</span></h1></div>
      <CandidateForm c={c} nextNumber={c.number} locked={phaseOf(s) === "open"} />
    </>
  );
}
