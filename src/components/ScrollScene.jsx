const metrics = [
  ["Platform fit", 14, 15],
  ["Hook strength", 13, 15],
  ["Creative strength", 12, 15],
  ["Offer clarity", 8, 10],
];

export default function ScrollScene() {
  return (
    <div className="adnex-scene">
      <div className="adnex-scene__stage">
        <div className="adnex-scene__halo adnex-scene__halo--one" />
        <div className="adnex-scene__halo adnex-scene__halo--two" />
        <div className="adnex-scene__plane adnex-scene__plane--back" />
        <div className="adnex-scene__plane adnex-scene__plane--mid" />
        <div className="adnex-scene__chip adnex-scene__chip--one">TikTok detected</div>
        <div className="adnex-scene__chip adnex-scene__chip--two">Weak offer risk</div>
        <div className="adnex-scene__chip adnex-scene__chip--three">Recommended: B</div>
        <div className="adnex-scene__card">
          <div className="adnex-scene__scan" />
          <div className="adnex-scene__topline">
            <span>Adnex analysis</span>
            <strong>High confidence</strong>
          </div>
          <div className="adnex-scene__header">
            <div>
              <span>Decision</span>
              <strong>Run Variant B first</strong>
            </div>
            <div className="adnex-scene__score">82</div>
          </div>
          <div className="adnex-scene__verdict">Recommended to run</div>
          <div className="adnex-scene__bars">
            {metrics.map(([label, score, max]) => (
              <div key={label}>
                <div className="adnex-scene__bar-label">
                  <span>{label}</span>
                  <span>{score}/{max}</span>
                </div>
                <div className="adnex-scene__bar-track">
                  <div style={{ width: `${(score / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="adnex-scene__rewrite">
            <span>Better hook</span>
            Stop wasting budget on ads your buyers scroll past.
          </div>
          <div className="adnex-scene__footer">
            <span>Compare-ready</span>
            <span>Budget risk reduced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
