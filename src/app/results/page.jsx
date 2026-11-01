"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import ScoreResult from "../../components/ScoreResult";
import { useBrowserStorage, useHydrated } from "../../lib/useBrowserStorage";

const resultKeys = ["adnex:last-result", "adscore:last-result"];

function formatStamp(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
    return `${day} · ${time}`.toUpperCase();
  } catch {
    return "";
  }
}

export default function ResultsPage() {
  const hydrated = useHydrated();
  const payload = useBrowserStorage("session", resultKeys);
  const stamp = formatStamp(payload?.createdAt);

  return (
    <>
      <Navbar />
      <main className="shell page">
        {!hydrated ? null : payload?.result ? (
          <>
            <div className="report-bar">
              <span className="meta">REPORT{stamp ? ` · ${stamp}` : ""}</span>
              <div className="report-bar__actions">
                <Link href="/dashboard" className="btn">Re-analyze</Link>
                <Link href="/compare" className="btn">Add to compare</Link>
                <button type="button" className="btn btn--primary" onClick={() => window.print()}>Export PDF</button>
              </div>
            </div>
            <ScoreResult result={payload.result} context={payload.context} ad={payload.ad} />
          </>
        ) : (
          <section className="page-head" style={{ borderBottom: 0 }}>
            <div>
              <p className="eyebrow">Reports</p>
              <h1 className="h1">No report yet.</h1>
              <p className="lede">Run an analysis first and the scorecard will appear here.</p>
            </div>
            <Link href="/dashboard" className="btn btn--accent btn--lg">Analyze an ad</Link>
          </section>
        )}
      </main>
    </>
  );
}
