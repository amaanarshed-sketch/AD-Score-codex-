"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Info } from "lucide-react";

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
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-cyan-200">
        {status.aiConfigured ? <BadgeCheck size={16} /> : <Info size={16} />}
        {status.aiConfigured ? "AI scoring active" : "Demo scoring active"}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {status.aiConfigured
          ? "Adnex is connected to AI analysis. Links provide platform/context only, and Video Hook Audit reviews sampled key frames rather than full video, audio, or transcripts."
          : "You can test the full product flow without paid AI calls. Scores, image reviews, and Video Hook Audit sections use the built-in demo engine until real AI is connected."}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {status.billingConfigured
          ? "Auth, billing, and subscription config appear ready."
          : "Billing is not fully configured yet. Add Supabase + Lemon Squeezy env vars before live payments."}
      </p>
    </section>
  );
}
