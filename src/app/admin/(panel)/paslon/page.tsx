import Link from "next/link";
import { getCandidates, getSettings, phaseOf } from "@/lib/election";
import { requireAdmin } from "@/lib/session";
import { paslonTheme } from "@/lib/voter";
import { Photo } from "@/components/Photo";
import { ConfirmSubmit } from "@/components/ui/ConfirmDialog";
import { FlashToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { deleteCandidate } from "../actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, ["success" | "error", string]> = {
  saved: ["success", "Data paslon disimpan."],
  deleted: ["success", "Paslon dihapus."],
  locked: ["error", "Paslon tidak bisa dihapus saat voting berlangsung."],
  hasvotes: ["error", "Paslon ini sudah punya suara, tidak bisa dihapus."],
};

export default async function PaslonList(props: PageProps<"/admin/paslon">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const [candidates, s] = await Promise.all([getCandidates(), getSettings()]);
  const locked = phaseOf(s) === "open";
  const flash = typeof sp.msg === "string" ? MSG[sp.msg] : undefined;

  return (
    <>
      {flash && <FlashToast key={String(sp.msg)} kind={flash[0]} message={flash[1]} />}
      <div className="main-h">
        <h1 className="d lc">pasangan <span className="mk">calon</span></h1>
        <div className="sp" />
        {locked && (
          <Tooltip text="Data paslon tidak bisa diubah atau dihapus selama voting berlangsung." side="bottom">
            <span className="chip chip-warn">terkunci selama voting</span>
          </Tooltip>
        )}
      </div>
      <div className="cand-grid">
        {candidates.map((c) => (
          <div className={`cg ${paslonTheme(c.number)}`} key={c.id}>
            <div style={{ position: "relative" }}>
              <Photo c={c} />
              <span className="num" style={{ position: "absolute", top: 10, left: 10, width: 36, height: 36, fontSize: 19, borderRadius: 9, zIndex: 2 }}>{c.number}</span>
            </div>
            <div className="in">
              <b>{c.president_name}</b><span>&amp; {c.vice_name}</span>
              <div className="act">
                <Link href={`/admin/paslon/${c.id}`} className="btn btn-s btn-sm">Edit</Link>
                <form action={deleteCandidate.bind(null, c.id)}>
                  <ConfirmSubmit
                    title={`Hapus paslon ${c.number}?`}
                    description={`${c.president_name} & ${c.vice_name} beserta foto dan profilnya akan dihapus permanen. Paslon yang sudah menerima suara tidak bisa dihapus.`}
                    confirmLabel="Ya, hapus"
                    disabled={locked}
                  >Hapus</ConfirmSubmit>
                </form>
              </div>
            </div>
          </div>
        ))}
        {!locked && <Link href="/admin/paslon/baru" className="cg add"><div><div style={{ fontSize: 34, lineHeight: 1 }}>+</div>Tambah paslon</div></Link>}
      </div>
    </>
  );
}
