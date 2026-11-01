"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { verdictTone } from "../../components/ScoreResult";
import { useBrowserStorage, useHydrated } from "../../lib/useBrowserStorage";

const historyKeys = ["adnex:analysis-history", "adscore:analysis-history"];
const noHistory = [];

function formatDate(value) {
  try {
    const date = new Date(value);
    const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
    return `${day} · ${time}`.toUpperCase();
  } catch {
    return "RECENT";
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const stored = useBrowserStorage("local", historyKeys, noHistory);
  const history = Array.isArray(stored) ? stored : noHistory;

  function openReport(item) {
    sessionStorage.setItem(
      "adnex:last-result",
      JSON.stringify({ result: item.result, ad: item.ad || {}, context: { platform: item.platform, objective: item.objective, audience: item.audience }, createdAt: item.createdAt }),
    );
    router.push("/results");
  }

  return (
    <>
      <Navbar />
      <main className="shell page">
        <section className="page-head">
          <div>
            <p className="eyebrow">Reports · saved in this browser</p>
            <h1 className="h1">Every reading, in one place.</h1>
            <p className="lede">Your last 20 analyses are kept on this device. Open a single-ad report to see the full breakdown again.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/compare" className="btn">Compare ads</Link>
            <Link href="/dashboard" className="btn btn--primary">Analyze an ad</Link>
          </div>
        </section>

        {!hydrated ? null : history.length ? (
          <section className="section">
            <div className="table-wrap">
              <table className="table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Ad</th><th>Type</th><th>Score</th><th>Verdict</th><th>Confidence</th><th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const canOpen = item.type !== "compare" && item.result;
                    const verdict = item.type === "compare" ? "Compare" : item.action || "Revise";
                    return (
                      <tr key={item.id}>
                        <td className="meta" style={{ whiteSpace: "nowrap" }}>{formatDate(item.createdAt)}</td>
                        <td>
                          <div style={{ fontWeight: 500, maxWidth: 360 }}>{item.title}</div>
                          <div className="meta" style={{ marginTop: 4 }}>{[item.platform, item.objective].filter(Boolean).join(" · ").toUpperCase()}</div>
                        </td>
                        <td className="meta">{item.type === "compare" ? "COMPARE" : "SINGLE"}</td>
                        <td className="num">{item.score || 0}<span style={{ color: "var(--ink3)", fontSize: 12 }}>/100</span></td>
                        <td className={item.type === "compare" ? "" : `tone-${verdictTone(verdict)}`} style={{ fontWeight: 500, maxWidth: 260 }}>
                          {item.type === "compare" ? <span className="small">{item.action}</span> : verdict}
                        </td>
                        <td>{item.confidence || "Low"}</td>
                        <td style={{ textAlign: "right" }}>
                          {canOpen ? <button type="button" className="btn" onClick={() => openReport(item)}>Open</button> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="section" style={{ display: "grid", gap: 16, justifyItems: "start" }}>
            <h2 className="h2">No reports yet.</h2>
            <p className="body">Run a single analysis or compare ads, and your recent results will appear here.</p>
            <Link href="/dashboard" className="btn btn--accent btn--lg">Start your first analysis →</Link>
          </section>
        )}
      </main>
    </>
  );
}
