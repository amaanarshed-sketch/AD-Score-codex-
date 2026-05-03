import { AlertTriangle, BadgeCheck, CheckCircle2, Clapperboard, FileText, Lightbulb, Link2, PlaySquare, Radar, Sparkles, Target, Trophy } from "lucide-react";

const sections = [
  ["platform_fit", "Platform Fit"],
  ["objective_fit", "Objective Fit"],
  ["audience_fit", "Audience Fit"],
  ["hook_strength", "Hook Strength"],
  ["creative_strength", "Creative Strength"],
  ["offer_clarity", "Offer Clarity"],
  ["cta_strength", "CTA Strength"],
];

const videoSections = [
  ["hook_strength", "Hook Strength"],
  ["visual_clarity", "Visual Clarity"],
  ["offer_visibility", "Offer Visibility"],
  ["creative_structure", "Creative Structure"],
  ["cta_visibility", "CTA Visibility"],
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
    [summary.creative_type === "video", "Video Hook Audit", Clapperboard],
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
  const action = result.verdict || result.recommended_action || verdictFromScore(score);
  const tone = verdictFromAction(action);

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
          <VerdictBadge verdict={action}>{action || "Revise"}</VerdictBadge>
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

function scoreItem(scores = {}, key) {
  const aliases = {
    hook_strength: "hook",
    offer_clarity: "offer",
    cta_strength: "cta",
  };
  return scores[key] || scores[aliases[key]];
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

function potentialTone(value = "") {
  if (value === "High") return "run";
  if (value === "Medium") return "revise";
  return "reject";
}

function VideoHookAudit({ video }) {
  if (!video || video.analysis_mode === "none" || video.audit_type === "none") return null;
  const frameCount = Number(video.frame_count || 0);
  const analysisMode = video.analysis_mode === "sampled_key_frames" ? "Sampled key frames" : "Limited video context";

  return (
    <section className="ui-card">
      <h3 className="ui-section-title">
        <PlaySquare size={16} />
        Video Hook Audit
      </h3>
      <p className="ui-muted mt-2 text-sm leading-6">
        Video Hook Audit uses sampled key frames to evaluate scroll-stop potential, visual clarity, and offer visibility. It does not analyze full video, audio, or transcripts yet.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="input-summary__badge">Analysis mode: {analysisMode}</span>
        <span className="input-summary__badge">Frame count: {frameCount}</span>
        <span className={`verdict-badge verdict-badge--${potentialTone(video.attention_potential)}`}>
          Attention Potential: {video.attention_potential || "Low"}
        </span>
        <span className={`verdict-badge verdict-badge--${potentialTone(video.conversion_potential)}`}>
          Conversion Potential: {video.conversion_potential || "Low"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {videoSections.map(([key, title]) => (
          <BreakdownRow key={key} title={title} item={video[key] || { score: 0, max: 1, feedback: "No feedback returned." }} />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Final Video Verdict</p>
        <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--text-primary)]">{video.video_verdict || "Revise opening"}</p>
        <p className="ui-muted mt-2 text-xs leading-5">{video.limitations || "Based on sampled key frames only. Audio/transcript/full video sequence not analyzed."}</p>
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
          Performance Pattern
        </h3>
        <p className="mt-2 font-bold text-[color:var(--text-primary)]">{result.performance_pattern || "Unclear offer"}</p>
        <p className="ui-muted mt-2 text-sm leading-6">
          Attention Potential: {result.attention_potential || "Low"} · Conversion Potential: {result.conversion_potential || "Low"}
        </p>
      </section>

      <section className="ui-card">
        <h3 className="ui-section-title">
          <Target size={16} />
          Score Breakdown
        </h3>
        <div className="mt-4 grid gap-3">
          {sections.map(([key, title]) => (
            <BreakdownRow key={key} title={title} item={scoreItem(result.scores, key) || { score: 0, max: 1, feedback: "No feedback returned." }} />
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
          <VideoHookAudit video={result.video_hook_audit || result.video_analysis} />
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
