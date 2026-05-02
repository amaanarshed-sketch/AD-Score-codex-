import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";

const metrics = [
  ["Platform fit", 14, 15],
  ["Hook strength", 13, 15],
  ["Creative strength", 12, 15],
  ["Offer clarity", 8, 10],
];

export default function ScrollScene() {
  return (
    <div className="hero-score-visual" aria-label="Adnex scorecard preview">
      <div className="hero-score-orbit hero-score-orbit--left" aria-hidden="true">
        <span>Winner</span>
        <strong>Ad B</strong>
        <small>TikTok · Conversions</small>
      </div>

      <div className="hero-score-orbit hero-score-orbit--right" aria-hidden="true">
        <span>Risk</span>
        <strong>Weak offer</strong>
        <small>Fix before scaling</small>
      </div>

      <div className="hero-score-card">
        <div className="hero-score-card__top">
          <div>
            <span className="hero-score-card__eyebrow">Creative decision</span>
            <h2>Run Variant B first</h2>
          </div>
          <span className="hero-score-card__confidence">
            <ShieldCheck size={14} />
            High confidence
          </span>
        </div>

        <div className="hero-score-card__summary">
          <div>
            <span className="hero-score-card__label">Overall score</span>
            <div className="hero-score-card__score">
              82<span>/100</span>
            </div>
          </div>
          <span className="hero-score-card__verdict">
            <CheckCircle2 size={15} />
            Recommended to run
          </span>
        </div>

        <div className="hero-score-card__bars">
          {metrics.map(([label, score, max]) => (
            <div key={label} className="hero-score-card__metric">
              <div>
                <span>{label}</span>
                <strong>{score}/{max}</strong>
              </div>
              <div className="hero-score-card__track">
                <span style={{ width: `${(score / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="hero-score-card__insight">
          <Sparkles size={16} />
          <div>
            <span>Better hook</span>
            <p>Stop wasting budget on ads your buyers scroll past.</p>
          </div>
        </div>

        <div className="hero-score-card__grid">
          <div>
            <span>Keep</span>
            <p>Strong pain callout</p>
          </div>
          <div>
            <span>Fix</span>
            <p>Sharpen CTA</p>
          </div>
        </div>

        <div className="hero-score-card__footer">
          <span>
            <TriangleAlert size={14} />
            Budget risk reduced
          </span>
          <span>
            Compare-ready
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
