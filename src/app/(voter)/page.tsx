import { getCandidates, getSettings, phaseOf } from "@/lib/election";
import { CandidateSection, CompareTable, CtaBand, Hero, HowTo, LpFooter, LpNav, Overview } from "@/components/voter/Landing";

export const dynamic = "force-dynamic";

/** Beranda publik: terbuka kapan saja (sebelum, saat, dan sesudah voting). */
export default async function Landing() {
  const [s, candidates] = await Promise.all([getSettings(), getCandidates()]);
  const phase = phaseOf(s);

  return (
    <div className="lp">
      <LpNav phase={phase} />
      <Hero s={s} phase={phase} />
      <Overview candidates={candidates} />
      {candidates.map((c, i) => <CandidateSection key={c.id} c={c} total={candidates.length} flip={i % 2 === 1} />)}
      <CompareTable candidates={candidates} />
      <HowTo s={s} />
      <CtaBand s={s} phase={phase} />
      <LpFooter />
    </div>
  );
}
