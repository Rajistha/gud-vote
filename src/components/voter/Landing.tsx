import Image from "next/image";
import Link from "next/link";
import type { Candidate, Phase, Settings } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { paslonTheme, toLines, youtubeId } from "@/lib/voter";
import { Photo } from "@/components/Photo";
import { IconShield } from "@/components/icons";
import { CountdownCard, TimeLeft } from "./Clock";
import { Confetti } from "./Confetti";
import { ScrollProgress } from "./ScrollProgress";

const pad = (n: number) => String(n).padStart(2, "0");

export function LpNav({ phase }: { phase: Phase }) {
  return (
    <header className="lp-nav">
      <ScrollProgress />
      <div className="lp-wrap lp-nav-in">
        <Link href="/" className="lp-brand"><Image src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={38} height={46} priority />GUD Vote</Link>
        <nav className="lp-links" aria-label="Bagian halaman">
          <a href="#paslon">Paslon</a>
          <a href="#komparasi">Komparasi</a>
          <a href="#cara">Cara memilih</a>
        </nav>
        <Link href="/e-vote" className={`btn btn-sm ${phase === "open" ? "btn-s" : "btn-g"}`}>E-Vote</Link>
      </div>
    </header>
  );
}

export function Hero({ s, phase }: { s: Settings; phase: Phase }) {
  const now = new Date().toISOString();
  return (
    <section className="lp-hero">
      <Confetti />
      <div className="lp-wrap lp-hero-in">
        <div className="lp-hero-l">
          <h1 className="d">Regenerasi <span className="mk">Girl Up Diponegoro 2027</span></h1>
          <p className="lp-slogan">Rooted In Care, Equality Everywhere.</p>
          <p className="lp-lead">Kenali Pasangan Calon melalui visi, misi, dan programnya. Pemungutan suara dilaksanakan langsung di tempat pelaksanaan Regenerasi.</p>
          <div className="lp-cta">
            <a href="#paslon" className="btn btn-p">Kenali Pasangan Calon ↓</a>
            {phase !== "closed" && <Link href="/e-vote" className="btn btn-g">{phase === "open" ? "Masuk E-Vote →" : "E-Vote →"}</Link>}
          </div>
        </div>

        <div className="lp-hero-r">
          <Image className="lp-hero-logo" src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={180} height={216} priority />
          {phase === "upcoming" && s.opens_at && (
            <>
              <p className="lp-cap">E-Vote dibuka dalam</p>
              <CountdownCard target={s.opens_at.toISOString()} serverNow={now} />
              <p className="lp-when">{fmtDate(s.opens_at)}</p>
            </>
          )}
          {phase === "open" && s.closes_at && (
            <div className="timer" style={{ margin: 0 }}>
              <div className="t"><small>sisa waktu memilih</small><TimeLeft target={s.closes_at.toISOString()} serverNow={now} /></div>
              <Link href="/e-vote" className="btn btn-p btn-sm">Ke E-Vote →</Link>
            </div>
          )}
          {phase === "closed" && <p className="lp-cap" style={{ margin: 0 }}>Terima kasih atas partisipasi Anda.</p>}
        </div>
      </div>
      <div className="ticker" aria-hidden="true">
        <div>Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱ Rooted In Care, Equality Everywhere ✱</div>
      </div>
    </section>
  );
}

export function Overview({ candidates }: { candidates: Candidate[] }) {
  return (
    <section id="paslon" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-kicker">01 / Profil</div>
        <h2 className="d lp-h2">Kenali <span className="mk">Pasangan Calon</span></h2>
        {candidates.length === 0 ? (
          <p className="muted">Pasangan Calon akan diumumkan panitia.</p>
        ) : (
          <div className="lp-grid">
            {candidates.map((c) => (
              <a key={c.id} href={`#paslon-${c.number}`} className={`lp-ocard ${paslonTheme(c.number)}`}>
                <div className="lp-onum">{c.number}</div>
                <div className="lp-obody">
                  <b>{c.president_name} &amp; {c.vice_name}</b>
                  {(c.president_info || c.vice_info) && <span>{[c.president_info, c.vice_info].filter(Boolean).join(" · ")}</span>}
                  <u>Lihat profil lengkap ↓</u>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return <ol className="mis">{items.map((m, i) => <li key={i}><b>{i + 1}</b>{m}</li>)}</ol>;
}

export function CandidateSection({ c, total, flip }: { c: Candidate; total: number; flip?: boolean }) {
  const vision = toLines(c.vision);
  const mission = toLines(c.mission);
  const programs = toLines(c.programs);
  const yt = youtubeId(c.video_url);

  return (
    <section id={`paslon-${c.number}`} className={`lp-cand ${paslonTheme(c.number)}${flip ? " flip" : ""}`}>
      <div className="lp-cand-side">
        <div className="lp-side-in">
          <div className="lp-bignum" aria-hidden="true">{c.number}</div>
          <Photo c={c} className="lp-photo" />
          <span className="lp-count">{c.number}/{total}</span>
        </div>
      </div>
      <div className="lp-cand-body">
        <span className="chip">Paslon {pad(c.number)}</span>
        <h2 className="d lp-cname">{c.president_name}<br /><span className="mk">&amp; {c.vice_name}</span></h2>
        <p className="lp-pair">Calon Presiden · Calon Wakil Presiden{(c.president_info || c.vice_info) ? ` — ${[c.president_info, c.vice_info].filter(Boolean).join(" / ")}` : ""}</p>

        <h3 className="lp-h3">visi</h3>
        {vision.length ? <p className="vision">{vision.join(" ")}</p> : <p className="muted">Visi belum diisi.</p>}

        <h3 className="lp-h3">misi</h3>
        {mission.length ? <List items={mission} /> : <p className="muted">Misi belum diisi.</p>}

        <h3 className="lp-h3">program unggulan</h3>
        {programs.length ? <List items={programs} /> : <p className="muted">Program belum diisi.</p>}

        {(yt || c.video_url) && (
          <>
            <h3 className="lp-h3">video kampanye</h3>
            {yt ? (
              <div className="video">
                <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={`Video kampanye paslon ${c.number}`} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            ) : (
              <div className="video"><a href={c.video_url!} target="_blank" rel="noopener noreferrer">Buka video kampanye ↗</a></div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function CompareTable({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length < 2) return null;
  const rows: { title: string; cell: (c: Candidate) => React.ReactNode }[] = [
    { title: "Latar belakang", cell: (c) => [c.president_info, c.vice_info].filter(Boolean).join(" · ") || "–" },
    { title: "Visi", cell: (c) => toLines(c.vision).join(" ") || "–" },
    { title: "Program unggulan", cell: (c) => { const p = toLines(c.programs); return p.length ? <ul>{p.map((x, i) => <li key={i}>{x}</li>)}</ul> : "–"; } },
  ];
  return (
    <section id="komparasi" className="lp-section lp-alt">
      <div className="lp-wrap">
        <div className="lp-kicker">02 / Komparasi</div>
        <h2 className="d lp-h2">Komparasi <span className="mk">Pasangan Calon</span></h2>
        <div className="lp-tablewrap">
          <table className="lp-cmp">
            <thead>
              <tr>
                <th />
                {candidates.map((c) => (
                  <th key={c.id} className={paslonTheme(c.number)}>
                    <span className="nb">{c.number}</span>
                    <b>{c.president_name} &amp; {c.vice_name}</b>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.title}>
                  <th scope="row">{r.title}</th>
                  {candidates.map((c) => <td key={c.id}>{r.cell(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? "gudvote.site";

export function HowTo({ s }: { s: Settings }) {
  // Tanggal mengikuti jadwal yang diatur admin.
  const when = s.opens_at ? `pada ${fmtDate(s.opens_at)}` : "pada tanggal yang akan diumumkan panitia";
  const steps: [string, string, React.ReactNode][] = [
    ["1", "Hadiri acara", <>Datang ke acara <b>Regenerasi Girl Up Diponegoro 2027</b> {when}.</>],
    ["2", "Akses E-Vote", <>Pindai QR Code yang tertera di layar atau buka melalui halaman <Link href="/e-vote" className="lp-url">{SITE_HOST}/e-vote</Link>.</>],
    ["3", "Suara tersimpan", "Setelah Anda memilih dan mengonfirmasi, suara Anda tersimpan dengan aman. Thank you GUDies!"],
  ];
  return (
    <section id="cara" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-kicker">03 / Cara Memilih</div>
        <h2 className="d lp-h2">Cara <span className="mk">Memilih</span></h2>
        <div className="lp-steps">
          {steps.map(([n, t, d]) => (
            <div key={n} className="lp-step"><i>{n}</i><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
        <p className="priv" style={{ marginTop: 28 }}><IconShield /><span>Pilihan Anda bersifat rahasia dan tidak terhubung dengan identitas Anda.</span></p>
      </div>
    </section>
  );
}

export function CtaBand({ s, phase }: { s: Settings; phase: Phase }) {
  return (
    <section className="lp-band">
      <div className="lp-wrap lp-band-in">
        <h2 className="d">{phase === "closed" ? <>Voting <span className="mk">Ditutup</span></> : <span className="mk">E-Vote</span>}</h2>
        {phase === "upcoming" && s.opens_at && <p>E-Vote dibuka {fmtDate(s.opens_at)} pukul {fmtTime(s.opens_at)}.</p>}
        {phase === "open" && <p>E-Vote sedang dibuka.</p>}
        {phase === "closed" && <p>Pemungutan suara telah ditutup. Terima kasih atas partisipasi Anda.</p>}
        {phase !== "closed" && <Link href="/e-vote" className="btn btn-p">{phase === "open" ? "Masuk E-Vote →" : "Buka E-Vote →"}</Link>}
      </div>
    </section>
  );
}

export function LpFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap">
        <Image src="/logo-gud.png" alt="Girl Up Diponegoro" width={64} height={76} />
        <p><b>Rooted In Care, Equality Everywhere.</b></p>
        <p className="muted">Regenerasi Girl Up Diponegoro 2027</p>
      </div>
    </footer>
  );
}
