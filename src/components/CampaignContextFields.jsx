"use client";

export const platforms = ["Meta / Facebook / Instagram", "TikTok", "Google Ads", "LinkedIn"];
export const objectives = ["Conversions", "Leads", "Engagement", "Traffic", "Awareness"];

export default function CampaignContextFields({ platform, platformSource, objective, audience, onPlatformChange, onObjectiveChange, onAudienceChange }) {
  return (
    <div className="grid-auto" style={{ "--min": "220px", "--gap": "20px" }}>
      <label className="field">
        <span className="field__label">Platform</span>
        <select value={platform} onChange={(event) => onPlatformChange(event.target.value)} className="select">
          {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {platformSource?.type === "link" ? <p className="hint hint--ok">{platformSource.label.toUpperCase()}</p> : null}
      </label>
      <label className="field">
        <span className="field__label">Objective</span>
        <select value={objective} onChange={(event) => onObjectiveChange(event.target.value)} className="select">
          {objectives.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Target audience</span>
        <input
          value={audience}
          onChange={(event) => onAudienceChange(event.target.value)}
          placeholder="e.g. women 25–40 in the US who buy skincare online"
          className="input"
        />
      </label>
    </div>
  );
}
