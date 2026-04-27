import { AlertTriangle, BadgeCheck, CheckCircle2, Clapperboard, FileText, Lightbulb, Link2, Radar, Sparkles, Target, Trophy } from "lucide-react";

const sections = [
  ["platform_fit", "Platform Fit"],
  ["objective_fit", "Objective Fit"],
  ["audience_fit", "Audience Fit"],
  ["hook", "Hook"],
  ["creative_strength", "Creative Strength"],
  ["clarity", "Clarity"],
  ["offer", "Offer"],
  ["cta", "CTA"],
];

function scoreColor(score) {
  if (score >= 78) return "text-emerald-300";
  if (score >= 55) return "text-amber-300";
  return "text-rose-300";
}

function pillStyle(value) {
  if (value === "Run" || value === "High") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
  if (value === "Revise" || value === "Medium") return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  return "border-rose-300/30 bg-rose-300/10 text-rose-200";
}

function inputBadges(summary = {}) {
  return [
    [summary.has_copy, "Copy provided", FileText],
    [summary.creative_type === "image", "Image provided", Clapperboard],
    [summary.creative_type === "video", "Video provided", Clapperboard],
    [summary.has_link, "Link provided", Link2],
  ].filter(([enabled]) => enabled);
}

function ListSection({ title, icon: Icon, items, tone = "cyan" }) {
  if (!items?.length) return null;
  const toneClass = tone === "rose" ? "border-rose-300/20 bg-rose-300/5 text-rose-200" : tone === "emerald" ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-200" : "border-cyan-300/20 bg-cyan-300/5 text-cyan-200";

  return (
    <section className={`rounded-lg border p-4 ${toneClass}`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]">
        <Icon size={16} />
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ScoreResult({ result, context, label, recommended = false, compact = false }) {
  if (!result) return null;

  const badges = inputBadges(result.input_summary);

  return (
    <article className={`rounded-xl border bg-slate-950 p-5 ${recommended ? "border-emerald-300/50 shadow-lg shadow-emerald-950/20" : "border-white/10"}`}>
      <section className="mb-5 rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {label ? <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p> : null}
            <div className="mt-2 flex items-end gap-2">
              <span className={`text-6xl font-black leading-none ${scoreColor(result.overall_score)}`}>{result.overall_score}</span>
              <span className="pb-2 text-sm font-semibold text-slate-500">/100</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`rounded-full border px-3 py-1 text-xs font-black ${pillStyle(result.confidence)}`}>
              Confidence: {result.confidence || "Low"}
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-black ${pillStyle(result.recommended_action)}`}>
              {result.recommended_action || "Revise"}
            </div>
            {recommended ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <Trophy size={14} />
                Recommended to Run
              </div>
            ) : null}
          </div>
        </div>

        {context ? (
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <span className="block text-slate-500">Platform</span>
              <strong className="text-slate-200">{context.platform}</strong>
            </div>
            <div>
              <span className="block text-slate-500">Objective</span>
              <strong className="text-slate-200">{context.objective}</strong>
            </div>
            <div>
              <span className="block text-slate-500">Target audience</span>
              <strong className="text-slate-200">{context.audience || "Not provided"}</strong>
            </div>
          </div>
        ) : null}
      </section>

      {badges.length ? (
        <section className="mb-5 flex flex-wrap gap-2">
          {badges.map(([, title, Icon]) => (
            <span key={title} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
              <Icon size={13} />
              {title}
            </span>
          ))}
        </section>
      ) : null}

      <div className="grid gap-4">
        <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-200">
            <Radar size={16} />
            Detected Ad Angle
          </h3>
          <p className="font-bold text-white">{result.detected_angle?.angle || "Other"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{result.detected_angle?.explanation || "The ad angle is not strongly defined yet."}</p>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
            <Target size={16} />
            Score Breakdown
          </h3>
          <div className="grid gap-3">
            {sections.map(([key, title]) => {
              const item = result.scores?.[key] || { score: 0, max: 1, feedback: "No feedback returned." };
              const width = Math.max(0, Math.min(100, (Number(item.score || 0) / Number(item.max || 1)) * 100));

              return (
                <section key={key} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h4 className="font-bold text-white">{title}</h4>
                    <span className="text-sm font-bold text-cyan-300">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div className="mb-3 h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${width}%` }} />
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{item.feedback}</p>
                </section>
              );
            })}
          </div>
        </section>

        <ListSection title="Critical Issues" icon={AlertTriangle} items={result.critical_issues} tone="rose" />
        <ListSection title="Key Strengths" icon={BadgeCheck} items={result.key_strengths} tone="emerald" />

        {!compact ? (
          <>
            <ListSection title="Better Hook Ideas" icon={Sparkles} items={result.hook_rewrites} />
            <ListSection title="Creative Recommendations" icon={Clapperboard} items={result.creative_recommendations} />
          </>
        ) : null}

        <ListSection title="Recommendations" icon={Lightbulb} items={result.improvements} />

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
            <CheckCircle2 size={16} />
            Final Verdict
          </h3>
          <p className="text-sm font-semibold leading-6 text-slate-200">{result.final_verdict || "Revise before running."}</p>
        </section>
      </div>
    </article>
  );
}
