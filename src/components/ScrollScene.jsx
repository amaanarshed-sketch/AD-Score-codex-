const metrics = [
  ["Platform fit", 14, 15],
  ["Hook strength", 13, 15],
  ["Creative strength", 12, 15],
  ["Offer clarity", 8, 10],
];

export default function ScrollScene() {
  return (
    <div className="adscore-scene">
      <div className="adscore-scene__stage">
        <div className="adscore-scene__halo adscore-scene__halo--one" />
        <div className="adscore-scene__halo adscore-scene__halo--two" />
        <div className="adscore-scene__plane adscore-scene__plane--back" />
        <div className="adscore-scene__plane adscore-scene__plane--mid" />
        <div className="adscore-scene__chip adscore-scene__chip--one">TikTok detected</div>
        <div className="adscore-scene__chip adscore-scene__chip--two">Weak offer risk</div>
        <div className="adscore-scene__chip adscore-scene__chip--three">Recommended: B</div>
        <div className="adscore-scene__card">
          <div className="adscore-scene__scan" />
          <div className="adscore-scene__topline">
            <span>AdScore analysis</span>
            <strong>High confidence</strong>
          </div>
          <div className="adscore-scene__header">
            <div>
              <span>Decision</span>
              <strong>Run Variant B first</strong>
            </div>
            <div className="adscore-scene__score">82</div>
          </div>
          <div className="adscore-scene__verdict">Recommended to run</div>
          <div className="adscore-scene__bars">
            {metrics.map(([label, score, max]) => (
              <div key={label}>
                <div className="adscore-scene__bar-label">
                  <span>{label}</span>
                  <span>{score}/{max}</span>
                </div>
                <div className="adscore-scene__bar-track">
                  <div style={{ width: `${(score / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="adscore-scene__rewrite">
            <span>Better hook</span>
            Stop wasting budget on ads your buyers scroll past.
          </div>
          <div className="adscore-scene__footer">
            <span>Compare-ready</span>
            <span>Budget risk reduced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
