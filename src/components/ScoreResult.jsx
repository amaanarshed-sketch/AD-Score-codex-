import { AlertTriangle, BadgeCheck, CheckCircle2, Clapperboard, FileText, Lightbulb, Link2, PlaySquare, Radar, Sparkles, Target, Trophy } from "lucide-react";

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

const videoSections = [
  ["first_three_seconds", "First 3 Seconds"],
  ["visual_flow", "Visual Flow"],
  ["on_screen_text", "On-Screen Text"],
  ["product_clarity", "Product Clarity"],
  ["cta_timing", "CTA Timing"],
  ["platform_native_feel", "Platform-Native Feel"],
];

function verdictFromScore(score = 0) {
  if (score >= 80) return "run";
  if (score >= 60) return "revise";
  return "reject";
}

function verdictFromAction(action = "") {
  const normalized = action.toLowerCase();
  if (normalized.includes("run")) return "run";
  if (normalized.includes("reject")) return "reject";
  return "revise";
}

function titleCase(value = "") {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function inputBadges(summary = {}) {
  return [
    [summary.has_copy, "Copy provided", FileText],
    [summary.creative_type === "image", "Image provided", Clapperboard],
    [summary.creative_type === "video", "Video provided", Clapperboard],
    [summary.has_link, "Link provided", Link2],
  ].filter(([enabled]) => enabled);
}

export function VerdictBadge({ verdict, children }) {
  const tone = verdictFromAction(verdict || children);
  return <span className={`verdict-badge verdict-badge--${tone}`}>{children || titleCase(tone)}</span>;
}

function ConfidenceBadge({ confidence = "Low" }) {
  const tone = confidence === "High" ? "run" : confidence === "Medium" ? "revise" : "reject";
  return <span className={`verdict-badge verdict-badge--${tone}`}>Confidence: {confidence}</span>;
}

function ScoreSummaryCard({ result, context, label, recommended }) {
  const score = Number(result.overall_score || 0);
  const tone = verdictFromAction(result.recommended_action || verdictFromScore(score));

  return (
    <section className={`score-summary score-summary--${tone}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {label ? <p className="ui-eyebrow">{label}</p> : null}
          <div className="mt-2 flex items-end gap-2">
            <span className="score-summary__number">{score}</span>
            <span className="score-summary__max">/100</span>
          </div>
          <p className="score-summary__verdict">{result.final_verdict || "Revise before running."}</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <ConfidenceBadge confidence={result.confidence || "Low"} />
          <VerdictBadge verdict={result.recommended_action}>{result.recommended_action || "Revise"}</VerdictBadge>
          {recommended ? (
            <span className="verdict-badge verdict-badge--run inline-flex items-center gap-2">
              <Trophy size={14} />
              Recommended to Run
            </span>
          ) : null}
        </div>
      </div>

      {context ? (
        <div className="score-summary__context">
          <div>
            <span>Platform</span>
            <strong>{context.platform}</strong>
          </div>
          <div>
            <span>Objective</span>
            <strong>{context.objective}</strong>
          </div>
          <div>
            <span>Target audience</span>
            <strong>{context.audience || "Not provided"}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BreakdownRow({ title, item }) {
  const score = Number(item?.score || 0);
  const max = Number(item?.max || 1);
  const percent = Math.max(0, Math.min(100, (score / max) * 100));
  const tone = verdictFromScore(percent);

  return (
    <section className="breakdown-row">
      <div className="breakdown-row__top">
        <h4>{title}</h4>
        <span>{score}/{max}</span>
      </div>
      <div className="breakdown-row__track">
        <div className={`breakdown-row__fill breakdown-row__fill--${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <p>{item?.feedback || "No feedback returned."}</p>
    </section>
  );
}

function ListSection({ title, icon: Icon, items, tone = "neutral" }) {
  if (!items?.length) return null;
  return (
    <section className={`ui-card list-section list-section--${tone}`}>
      <h3 className="ui-section-title">
        <Icon size={16} />
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="list-section__item">
            <span />
            <p>{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideoAudit({ video }) {
  if (!video || video.audit_type === "none") return null;

  return (
    <section className="ui-card">
      <h3 className="ui-section-title">
        <PlaySquare size={16} />
        Video Audit
      </h3>
      <p className="ui-muted mt-2 text-sm leading-6">{video.summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {videoSections.map(([key, title]) => (
          <BreakdownRow key={key} title={title} item={video[key] || { score: 0, max: 1, feedback: "No feedback returned." }} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ListSection title="Retention Risks" icon={AlertTriangle} items={video.retention_risks} tone="reject" />
        <ListSection title="Scene Fixes" icon={Lightbulb} items={video.scene_recommendations} />
      </div>
    </section>
  );
}

export default function ScoreResult({ result, context, label, recommended = false, compact = false }) {
  if (!result) return null;
  const badges = inputBadges(result.input_summary);

  return (
    <article className="score-result">
      <ScoreSummaryCard result={result} context={context} label={label} recommended={recommended} />

      {badges.length ? (
        <section className="input-summary">
          {badges.map(([, title, Icon]) => (
            <span key={title} className="input-summary__badge">
              <Icon size={13} />
              {title}
            </span>
          ))}
        </section>
      ) : null}

      <section className="ui-card">
        <h3 className="ui-section-title">
          <Radar size={16} />
          Detected Ad Angle
        </h3>
        <p className="mt-2 font-bold text-[color:var(--text-primary)]">{result.detected_angle?.angle || "Other"}</p>
        <p className="ui-muted mt-2 text-sm leading-6">{result.detected_angle?.explanation || "The ad angle is not strongly defined yet."}</p>
      </section>

      <section className="ui-card">
        <h3 className="ui-section-title">
          <Target size={16} />
          Score Breakdown
        </h3>
        <div className="mt-4 grid gap-3">
          {sections.map(([key, title]) => (
            <BreakdownRow key={key} title={title} item={result.scores?.[key] || { score: 0, max: 1, feedback: "No feedback returned." }} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ListSection title="Critical Issues" icon={AlertTriangle} items={result.critical_issues} tone="reject" />
        <ListSection title="Key Strengths" icon={BadgeCheck} items={result.key_strengths} tone="run" />
      </div>

      {!compact ? (
        <>
          <ListSection title="Better Hook Ideas" icon={Sparkles} items={result.hook_rewrites} />
          <VideoAudit video={result.video_analysis} />
          <ListSection title="Creative Recommendations" icon={Clapperboard} items={result.creative_recommendations} />
        </>
      ) : null}

      <ListSection title="Recommendations" icon={Lightbulb} items={result.improvements} />

      <section className="ui-card">
        <h3 className="ui-section-title">
          <CheckCircle2 size={16} />
          Final Verdict
        </h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--text-secondary)]">{result.final_verdict || "Revise before running."}</p>
      </section>
    </article>
  );
}
