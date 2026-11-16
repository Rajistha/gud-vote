import Image from "next/image";
import Link from "next/link";
import type { Candidate, Phase, Settings } from "@/lib/election";
import { fmtDate, fmtTime } from "@/lib/format";
import { paslonTheme, toLines, youtubeId } from "@/lib/voter";
import { Photo } from "@/components/Photo";
import { IconShield } from "@/components/icons";
import { CountdownCard, TimeLeft } from "./Clock";

const pad = (n: number) => String(n).padStart(2, "0");

export function LpNav({ phase }: { phase: Phase }) {
  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav-in">
        <Link href="/" className="lp-brand"><Image src="/girlup-mark.png" alt="" width={30} height={30} />gud vote</Link>
        <nav className="lp-links" aria-label="Bagian halaman">
          <a href="#paslon">Paslon</a>
          <a href="#bandingkan">Bandingkan</a>
          <a href="#cara">Cara memilih</a>
        </nav>
        <Link href="/bilik" className={`btn btn-sm ${phase === "open" ? "btn-s" : "btn-g"}`}>Bilik suara</Link>
      </div>
    </header>
  );
}

export function Hero({ s, phase }: { s: Settings; phase: Phase }) {
  const now = new Date().toISOString();
  return (
    <section className="lp-hero">
      <div className="lp-wrap lp-hero-in">
        <div className="lp-hero-l">
          <h1 className="d lc">regenerasi <span className="mk">girl up diponegoro</span></h1>
          <p className="lp-slogan">Rooted In Care, Equality Everywhere.</p>
          <p className="lp-lead">Kenali pasangan calon melalui visi, misi, dan programnya. Pemungutan suara dilaksanakan langsung di lokasi acara.</p>
          <div className="lp-cta">
            <a href="#paslon" className="btn btn-p">Lihat pasangan calon ↓</a>
            {phase !== "closed" && <Link href="/bilik" className="btn btn-g">{phase === "open" ? "Masuk bilik suara →" : "Bilik suara →"}</Link>}
          </div>
        </div>

        <div className="lp-hero-r">
          <Image className="lp-hero-logo" src="/logo-gud.png" alt="Logo Girl Up Diponegoro" width={180} height={216} priority />
          {phase === "upcoming" && s.opens_at && (
            <>
              <p className="lp-cap">Bilik suara dibuka dalam</p>
              <CountdownCard target={s.opens_at.toISOString()} serverNow={now} />
              <p className="lp-when">{fmtDate(s.opens_at)} <span>· {fmtTime(s.opens_at)}</span></p>
            </>
          )}
          {phase === "open" && s.closes_at && (
            <div className="timer" style={{ margin: 0 }}>
              <div className="t"><small>sisa waktu memilih</small><TimeLeft target={s.closes_at.toISOString()} serverNow={now} /></div>
              <Link href="/bilik" className="btn btn-p btn-sm">Ke bilik →</Link>
            </div>
          )}
          {phase === "closed" && <p className="lp-cap" style={{ margin: 0 }}>Terima kasih atas partisipasi Anda.</p>}
        </div>
      </div>
      <div className="ticker" aria-hidden="true">
        <div>rooted in care ✱ equality everywhere ✱ rooted in care ✱ equality everywhere ✱ rooted in care ✱ equality everywhere ✱ rooted in care ✱ equality everywhere ✱</div>
      </div>
    </section>
  );
}

export function Overview({ candidates }: { candidates: Candidate[] }) {
  return (
    <section id="paslon" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-kicker">01 / pasangan calon</div>
        <h2 className="d lc lp-h2">pasangan <span className="mk">calon.</span></h2>
        {candidates.length === 0 ? (
          <p className="muted">Pasangan calon akan diumumkan panitia.</p>
        ) : (
          <div className="lp-grid">
            {candidates.map((c) => (
              <a key={c.id} href={`#paslon-${c.number}`} className={`lp-ocard ${paslonTheme(c.number)}`}>
                <div className="lp-onum">{c.number}</div>
                <div className="lp-obody">
                  <b>{c.president_name} &amp; {c.vice_name}</b>
                  {(c.president_info || c.vice_info) && <span>{[c.president_info, c.vice_info].filter(Boolean).join(" · ")}</span>}
                  {c.tagline && <em>{c.tagline}</em>}
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
        <span className="chip">paslon {pad(c.number)}</span>
        <h2 className="d lc lp-cname">{c.president_name}<br /><span className="mk">&amp; {c.vice_name}</span></h2>
        <p className="lp-pair">calon presiden · calon wakil presiden{(c.president_info || c.vice_info) ? ` — ${[c.president_info, c.vice_info].filter(Boolean).join(" / ")}` : ""}</p>
        {c.tagline && <p className="lp-tagline">&ldquo;{c.tagline}&rdquo;</p>}

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
    { title: "Tagline", cell: (c) => c.tagline ?? "–" },
    { title: "Latar belakang", cell: (c) => [c.president_info, c.vice_info].filter(Boolean).join(" · ") || "–" },
    { title: "Visi", cell: (c) => toLines(c.vision).join(" ") || "–" },
    { title: "Program unggulan", cell: (c) => { const p = toLines(c.programs); return p.length ? <ul>{p.map((x, i) => <li key={i}>{x}</li>)}</ul> : "–"; } },
  ];
  return (
    <section id="bandingkan" className="lp-section lp-alt">
      <div className="lp-wrap">
        <div className="lp-kicker">02 / perbandingan</div>
        <h2 className="d lc lp-h2">perbandingan <span className="mk">paslon.</span></h2>
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
    ["1", "Hadiri acara", <>Datang ke acara <b>Regenerasi Girl Up Diponegoro</b> {when}.</>],
    ["2", "Akses bilik suara", <>Pindai QR Code yang tersedia di lokasi, atau buka halaman <Link href="/bilik" className="lp-url">{SITE_HOST}/bilik</Link>.</>],
    ["3", "Suara tersimpan", "Setelah Anda memilih dan mengonfirmasi, suara Anda tersimpan dengan aman."],
  ];
  return (
    <section id="cara" className="lp-section">
      <div className="lp-wrap">
        <div className="lp-kicker">03 / cara memilih</div>
        <h2 className="d lc lp-h2">cara <span className="mk">memilih.</span></h2>
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
        <h2 className="d lc">{phase === "closed" ? <>voting <span className="mk">ditutup.</span></> : <>bilik <span className="mk">suara.</span></>}</h2>
        {phase === "upcoming" && s.opens_at && <p>Bilik suara dibuka {fmtDate(s.opens_at)} pukul {fmtTime(s.opens_at)}.</p>}
        {phase === "open" && <p>Bilik suara sedang dibuka.</p>}
        {phase === "closed" && <p>Pemungutan suara telah ditutup. Terima kasih atas partisipasi Anda.</p>}
        {phase !== "closed" && <Link href="/bilik" className="btn btn-p">{phase === "open" ? "Masuk bilik suara →" : "Buka bilik suara →"}</Link>}
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
        <p className="muted">Regenerasi Girl Up Diponegoro</p>
      </div>
    </footer>
  );
}
