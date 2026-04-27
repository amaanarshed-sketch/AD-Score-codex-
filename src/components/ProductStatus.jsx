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
          ? "AdScore is connected to AI analysis. Links still provide platform/context only unless scraping is added later."
          : "You can test the full product flow without paid AI calls. Scores use the built-in demo engine until an API key is connected."}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {status.storageConfigured ? "Cloud storage appears configured." : "Uploads preview locally for now. Saved analyses stay in this browser."}
      </p>
    </section>
  );
}
