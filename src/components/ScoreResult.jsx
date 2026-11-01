"use client";

import { useEffect, useState } from "react";

export const SCORE_SECTIONS = [
  { id: "hook_strength", name: "Hook strength", short: "HOOK", max: 20 },
  { id: "platform_fit", name: "Platform fit", short: "PLATFORM", max: 15 },
  { id: "objective_fit", name: "Objective fit", short: "OBJECTIVE", max: 15 },
  { id: "audience_fit", name: "Audience fit", short: "AUDIENCE", max: 15 },
  { id: "creative_strength", name: "Creative strength", short: "CREATIVE", max: 15 },
  { id: "offer_clarity", name: "Offer clarity", short: "OFFER", max: 10 },
  { id: "cta_strength", name: "CTA strength", short: "CTA", max: 10 },
];

const VIDEO_SECTIONS = [
  ["hook_strength", "Opening-frame hook"],
  ["visual_clarity", "Visual clarity"],
  ["offer_visibility", "Offer visibility"],
  ["creative_structure", "Opening structure"],
  ["cta_visibility", "CTA visibility"],
];

const scoreAliases = { hook_strength: "hook", offer_clarity: "offer", cta_strength: "cta" };

// Matches the API's verdict logic: Run 80+, Revise 60-79, Reject below 60.
export const VERDICT_BANDS = [
  { label: "REJECT", from: 0, to: 60, color: "var(--dk-rej)" },
  { label: "REVISE", from: 60, to: 80, color: "var(--dk-rev)" },
  { label: "RUN", from: 80, to: 100, color: "var(--dk-run)" },
];

export function verdictOf(result = {}) {
  const action = String(result.verdict || result.recommended_action || "");
  if (/run/i.test(action)) return "Run";
  if (/reject/i.test(action)) return "Reject";
  if (/revise/i.test(action)) return "Revise";
  const score = Number(result.overall_score || 0);
  return score >= 80 ? "Run" : score >= 60 ? "Revise" : "Reject";
}

export function verdictTone(verdict = "") {
  if (/run/i.test(verdict)) return "run";
  if (/reject|do not/i.test(verdict)) return "rej";
  return "rev";
}

const darkToneColor = { run: "var(--dk-run)", rev: "var(--dk-rev)", rej: "var(--dk-rej)" };

function ratioColor(ratio, dark = false) {
  if (ratio < 0.5) return dark ? "var(--dk-rej)" : "var(--rej)";
  if (ratio < 0.75) return dark ? "var(--dk-rev)" : "var(--rev)";
  return dark ? "var(--dk-ink)" : "var(--ink)";
}

function scoreItem(scores = {}, key) {
  const raw = scores[key] ?? scores[scoreAliases[key]];
  return typeof raw === "number" ? { score: raw } : raw || {};
}

export function sectionValues(scores = {}) {
  return SCORE_SECTIONS.map((section) => {
    const item = scoreItem(scores, section.id);
    const max = Number(item.max || section.max);
    const val = Math.max(0, Math.min(max, Number(item.score || 0)));
    return { ...section, max, val, ratio: val / max, note: item.feedback || "" };
  });
}

function pad(index) {
  return String(index + 1).padStart(2, "0");
}

function useCountUp(target, duration = 1400) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - k, 3));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame((now) => {
      setProgress(0);
      tick(now);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return progress * target;
}

export function ReadingPanel({ score = 0, verdict = "Revise", confidence = "Low", summary, pattern, attention, conversion, scores, compact = false }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const shown = useCountUp(value);
  const pips = confidence === "High" ? 3 : confidence === "Medium" ? 2 : 1;
  const tone = verdictTone(verdict);
  const strip = scores ? sectionValues(scores) : [];

  return (
    <div className={`reading${compact ? " reading--compact" : ""}`}>
      <div className="reading__head">
        <span>ADNEX READING</span>
        <span className="reading__confidence">
          CONFIDENCE
          <span className="reading__pips" aria-hidden="true">
            {[0, 1, 2].map((index) => <span key={index} className={index < pips ? "is-on" : ""} />)}
          </span>
          <span style={{ color: "var(--dk-ink)" }}>{String(confidence).toUpperCase()}</span>
        </span>
      </div>

      <div className="reading__body">
        <div className="reading__score" aria-label={`Score ${value} out of 100`}>
          <span className="reading__number">{Math.round(shown)}</span>
          <span className="reading__out-of">/100</span>
        </div>
        <div className="reading__verdict-col">
          <div className="reading__verdict" style={{ "--tone": darkToneColor[tone] }}>{verdict}</div>
          {summary ? <p className="reading__summary">{summary}</p> : null}
          {pattern || attention || conversion ? (
            <div className="reading__pattern">
              {pattern ? <><strong>{pattern}</strong><br /></> : null}
              {attention ? <>ATTENTION {attention} · </> : null}
              {conversion ? <>CONVERSION {conversion}</> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="gauge" aria-hidden="true">
        <div className="gauge__minor" />
        <div className="gauge__major" />
        <div className="gauge__end" />
        <div className="gauge__bands">
          {VERDICT_BANDS.map((band) => <div key={band.label} style={{ flex: band.to - band.from, background: band.color }} />)}
        </div>
        <div className="gauge__labels">
          {VERDICT_BANDS.map((band, index) => (
            <span key={band.label} style={{ flex: band.to - band.from }}>
              {index === VERDICT_BANDS.length - 1 ? <><span>{band.from} · {band.label}</span><span>100</span></> : `${band.from} · ${band.label}`}
            </span>
          ))}
        </div>
        <div className="gauge__needle" style={{ left: `${shown}%` }}>
          <span>{Math.round(shown)}</span>
          <span />
        </div>
      </div>

      {strip.length ? (
        <div className="strip">
          <div className="strip__grid">
            {strip.map((item) => (
              <div key={item.id} className="strip__cell">
                <span className="eyebrow">{item.short}</span>
                <span className="strip__value">{item.val}<small>/{item.max}</small></span>
                <div className="strip__track"><div style={{ width: `${item.ratio * 100}%`, background: ratioColor(item.ratio, true) }} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : <div style={{ height: 24 }} />}
    </div>
  );
}

function BreakdownRow({ name, val, max, ratio, note }) {
  return (
    <div className="breakdown-row">
      <div className="breakdown-row__main">
        <div>
          <div className="breakdown-row__name">{name}</div>
          <div className="track"><div style={{ width: `${ratio * 100}%`, background: ratioColor(ratio) }} /></div>
        </div>
        <div className="breakdown-row__value">{val}<small>/{max}</small></div>
      </div>
      <p className="small">{note || "No feedback returned."}</p>
    </div>
  );
}

function NumberedList({ label, tone, items }) {
  const list = items || [];
  return (
    <div>
      <p className="eyebrow" style={tone ? { color: `var(--${tone})` } : undefined}>{label} · {list.length}</p>
      {list.length ? (
        <ol className="numbered">
          {list.map((text, index) => (
            <li key={`${index}-${text}`}><span>{pad(index)}</span><span>{text}</span></li>
          ))}
        </ol>
      ) : <p className="small" style={{ marginTop: 18 }}>Nothing flagged.</p>}
    </div>
  );
}

function HookRewrites({ hooks = [], original }) {
  const [copied, setCopied] = useState(-1);
  if (!hooks.length) return null;

  async function copy(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
    } catch {
      setCopied(-1);
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="h2">Hook rewrites</h2>
        {original ? <span className="meta">ORIGINAL: “{original}”</span> : null}
      </div>
      <div className="cells">
        {hooks.map((text, index) => (
          <div key={`${index}-${text}`}>
            <span className="eyebrow">REWRITE {pad(index)}</span>
            <p className="quote">“{text}”</p>
            <button type="button" className="btn no-print" style={{ alignSelf: "flex-start" }} onClick={() => copy(text, index)}>
              {copied === index ? "Copied" : "Copy hook"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function potentialTone(value) {
  return value === "High" ? "run" : value === "Medium" ? "rev" : "rej";
}

function VideoHookAudit({ video }) {
  if (!video || video.analysis_mode === "none" || video.audit_type === "none") return null;
  const rows = VIDEO_SECTIONS.map(([key, name]) => {
    const item = video[key] || {};
    const max = Number(item.max || 1);
    const val = Math.max(0, Math.min(max, Number(item.score || 0)));
    return { id: key, name, val, max, ratio: val / max, note: item.feedback };
  });
  const mode = video.analysis_mode === "sampled_key_frames" ? "SAMPLED KEY FRAMES" : "LIMITED VIDEO CONTEXT";

  return (
    <section className="section">
      <div className="section-head" style={{ marginBottom: 8 }}>
        <h2 className="h2">Video hook audit</h2>
        <span className="meta">{mode} · {Number(video.frame_count || 0)} FRAMES</span>
      </div>
      <p className="body" style={{ maxWidth: 620, marginBottom: 28 }}>
        Most scroll decisions happen before the first second ends. This audit reads sampled key frames from the opening, not the full video, audio or transcript.
      </p>
      <div className="checks" style={{ marginBottom: 32 }}>
        <div><span>Attention potential</span><span className={`tone-${potentialTone(video.attention_potential)}`}>{String(video.attention_potential || "Low").toUpperCase()}</span></div>
        <div><span>Conversion potential</span><span className={`tone-${potentialTone(video.conversion_potential)}`}>{String(video.conversion_potential || "Low").toUpperCase()}</span></div>
        <div><span>Video verdict</span><span>{String(video.video_verdict || "Revise opening").toUpperCase()}</span></div>
      </div>
      <div className="rule-top">
        {rows.map((row) => <BreakdownRow key={row.id} {...row} />)}
      </div>
      <p className="meta" style={{ marginTop: 16 }}>{video.limitations || "Based on sampled key frames only. Audio/transcript/full video sequence not analyzed."}</p>
    </section>
  );
}

export function adTitle(ad = {}) {
  const firstLine = String(ad.adCopy || "").split("\n").map((line) => line.trim()).find(Boolean);
  const title = firstLine || ad.creativeFilename || ad.postLink || "Untitled ad";
  return title.length > 90 ? `${title.slice(0, 87)}…` : title;
}

function reportMeta(ad = {}, context = {}) {
  const creative = ad.creativeType === "video"
    ? `VIDEO${ad.videoDuration ? ` ${Math.floor(ad.videoDuration / 60)}:${String(ad.videoDuration % 60).padStart(2, "0")}` : ""}`
    : ad.creativeType === "image" ? "IMAGE" : ad.adCopy ? "COPY" : "LINK";
  return [creative, context.platform, context.objective, context.audience].filter(Boolean).map((part) => String(part).toUpperCase()).join(" · ");
}

export default function ScoreResult({ result, context = {}, ad = {} }) {
  if (!result) return null;
  const verdict = verdictOf(result);
  const breakdown = sectionValues(result.scores).sort((a, b) => (b.max - b.val) - (a.max - a.val));
  const firstLine = String(ad.adCopy || "").split("\n").map((line) => line.trim()).find(Boolean);
  const original = firstLine && firstLine.length > 70 ? `${firstLine.slice(0, 67)}…` : firstLine;

  return (
    <>
      <section className="section" style={{ paddingTop: "clamp(24px, 4vw, 40px)" }}>
        <div className="report-title">
          <div className="report-title__thumb hatch" aria-hidden="true" />
          <div>
            <h1 className="h3">{adTitle(ad)}</h1>
            <div className="meta" style={{ marginTop: 6 }}>{reportMeta(ad, context)}</div>
          </div>
        </div>
        <ReadingPanel
          score={result.overall_score}
          verdict={verdict}
          confidence={result.confidence || "Low"}
          summary={result.final_verdict}
          pattern={result.performance_pattern}
          attention={result.attention_potential}
          conversion={result.conversion_potential}
          scores={result.scores}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Score breakdown</h2>
          <span className="meta">SORTED BY POINTS LOST</span>
        </div>
        <div className="rule-top">
          {breakdown.map((item) => <BreakdownRow key={item.id} {...item} />)}
        </div>
      </section>

      <section className="triptych">
        <NumberedList label="CRITICAL ISSUES" tone="rej" items={result.critical_issues} />
        <NumberedList label="IMPROVEMENTS" items={result.improvements} />
        <NumberedList label="KEY STRENGTHS" tone="run" items={result.key_strengths} />
      </section>

      <HookRewrites hooks={result.hook_rewrites} original={original} />

      <VideoHookAudit video={result.video_hook_audit || result.video_analysis} />

      {result.creative_recommendations?.length ? (
        <section className="section">
          <div className="section-head">
            <h2 className="h2">Creative notes</h2>
          </div>
          <ol className="numbered rule-top" style={{ paddingTop: 18 }}>
            {result.creative_recommendations.map((text, index) => (
              <li key={`${index}-${text}`}><span>{pad(index)}</span><span>{text}</span></li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Submitted input</h2>
        </div>
        <div className="checks">
          <div><span>Ad copy</span><span>{ad.adCopy ? `${ad.adCopy.trim().length} CHARS` : "NONE"}</span></div>
          <div><span>Creative</span><span>{ad.creativeFilename ? String(ad.creativeType).toUpperCase() : "NONE"}</span></div>
          <div><span>Post link</span><span>{ad.postLink ? "PROVIDED" : "NONE"}</span></div>
          <div><span>Audience</span><span>{context.audience ? "SET" : "NOT SET"}</span></div>
        </div>
        {ad.adCopy ? <p className="body" style={{ marginTop: 20, whiteSpace: "pre-wrap", maxWidth: 760 }}>{ad.adCopy}</p> : null}
      </section>
    </>
  );
}
