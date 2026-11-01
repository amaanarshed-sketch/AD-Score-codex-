import Link from "next/link";
import Navbar, { BrandLink } from "../components/Navbar";
import { ReadingPanel } from "../components/ScoreResult";

const sampleScores = {
  hook_strength: { score: 8, max: 20 },
  platform_fit: { score: 12, max: 15 },
  objective_fit: { score: 9, max: 15 },
  audience_fit: { score: 11, max: 15 },
  creative_strength: { score: 9, max: 15 },
  offer_clarity: { score: 6, max: 10 },
  cta_strength: { score: 3, max: 10 },
};

const steps = [
  ["01", "Add the ad", "Paste the copy, upload the image or video, or drop in the post link. Set platform, objective and audience."],
  ["02", "Get the reading", "A 0–100 score, a Run / Revise / Reject verdict, and the exact points each area lost."],
  ["03", "Fix or pick", "Apply the fixes and hook rewrites, or compare up to four ads and test the one worth the budget."],
];

const weights = [
  ["Hook strength", 20, "Does the first line or frame stop the scroll?"],
  ["Platform fit", 15, "Does it feel native to the feed it will run in?"],
  ["Objective fit", 15, "Does the message serve sales, leads, traffic or awareness?"],
  ["Audience fit", 15, "Does it speak to a specific buyer at a specific moment?"],
  ["Creative strength", 15, "Does the visual carry the message on mute?"],
  ["Offer clarity", 10, "Is the value concrete enough to act on?"],
  ["CTA strength", 10, "Is the next step obvious, and early enough?"],
];

const plans = [
  ["Free", "$0", "5 credits / month · text and link"],
  ["Plus", "$15", "150 credits · image + video audits"],
  ["Pro", "$39", "750 credits · for teams and agencies"],
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">Pre-launch ad scoring · Meta · TikTok · Google · LinkedIn</p>
          <h1 className="display" style={{ maxWidth: 980 }}>Know if an ad will work before you pay to find out.</h1>
          <p className="lede">Adnex reads your copy, creative and campaign context, then gives a strict score, a clear verdict and the fixes to make before launch.</p>
          <div className="hero__actions">
            <Link href="/dashboard" className="btn btn--accent btn--lg">Analyze an ad →</Link>
            <Link href="/compare" className="btn btn--lg">Compare ads</Link>
            <span className="meta">5 FREE CREDITS · NO CARD NEEDED</span>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">What a reading looks like</h2>
            <span className="meta">EXAMPLE · VIDEO · TIKTOK · CONVERSIONS</span>
          </div>
          <ReadingPanel
            compact
            score={58}
            verdict="Reject"
            confidence="Medium"
            summary="Strong offer, weak first second. Fix the hook and the CTA before you spend."
            pattern="Weak hook"
            scores={sampleScores}
          />
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">How it works</h2>
            <span className="meta">THREE STEPS</span>
          </div>
          <div className="steps">
            {steps.map(([number, title, copy]) => (
              <div key={number}>
                <span className="meta">{number}</span>
                <h3 className="h3">{title}</h3>
                <p className="body">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">The scorecard</h2>
            <span className="meta">100 POINTS · 7 AREAS · NO GRADE INFLATION</span>
          </div>
          <div className="weights">
            {weights.map(([name, points, copy]) => (
              <div key={name}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span className="mono" style={{ fontWeight: 500 }}>{points}<span style={{ color: "var(--ink3)", fontSize: 12 }}> pts</span></span>
                <p className="small">{copy}</p>
              </div>
            ))}
          </div>
          <p className="small" style={{ marginTop: 20 }}>
            <span className="tone-run" style={{ fontWeight: 500 }}>Run</span> at 80+ with no major weakness ·{" "}
            <span className="tone-rev" style={{ fontWeight: 500 }}>Revise</span> at 60–79 ·{" "}
            <span className="tone-rej" style={{ fontWeight: 500 }}>Reject</span> below 60
          </p>
        </section>

        <section className="section grid-auto" style={{ "--min": "320px", "--gap": "40px", alignItems: "start" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <p className="eyebrow">Video Hook Audit</p>
            <h2 className="h2">Most scroll decisions happen before the first second ends.</h2>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <p className="body">Adnex samples key frames from the opening of your video and checks scroll-stop power, visual clarity, offer visibility and CTA timing. It separates attention potential from conversion potential, so a great hook can&apos;t hide a weak offer.</p>
            <p className="meta">SAMPLED KEY FRAMES · NOT FULL VIDEO, AUDIO OR TRANSCRIPT</p>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">Plans</h2>
            <Link href="/pricing" className="btn">See all plans</Link>
          </div>
          <div className="cells" style={{ "--min": "240px" }}>
            {plans.map(([name, price, detail]) => (
              <div key={name}>
                <span className="eyebrow">{name}</span>
                <div className="price">{price}<small> / month</small></div>
                <p className="small">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <BrandLink />
          <nav className="nav" style={{ flex: "none" }} aria-label="Footer">
            <Link href="/dashboard">Analyze</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/pricing">Plans</Link>
            <Link href="/account">Account</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
