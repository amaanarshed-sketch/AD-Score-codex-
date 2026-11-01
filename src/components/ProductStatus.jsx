"use client";

import { useEffect, useState } from "react";

export default function ProductStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/status")
      .then((response) => response.json())
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        if (active) setStatus({ aiConfigured: false, storageConfigured: false });
      });
    return () => {
      active = false;
    };
  }, []);

  if (!status) return null;

  return (
    <div className={`notice ${status.aiConfigured ? "notice--ok" : "notice--warn"}`}>
      <p className="eyebrow" style={{ color: "var(--ink)", marginBottom: 6 }}>
        {status.aiConfigured ? "AI scoring active" : "Demo scoring active"}
      </p>
      <p className="small">
        {status.aiConfigured
          ? "Adnex is connected to AI analysis. Links add platform context only, and Video Hook Audit reads sampled key frames, not full video, audio or transcripts."
          : "You can try the full flow without paid AI. Scores come from the built-in demo engine until real AI is connected."}
        {status.billingConfigured ? "" : " Billing is not fully configured yet."}
      </p>
    </div>
  );
}
