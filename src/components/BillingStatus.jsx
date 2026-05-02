"use client";

import { useEffect, useState } from "react";
import { CreditCard, Gauge, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function BillingStatus({ compact = false }) {
  const { configured: authConfigured, user, getAccessToken } = useAuth();
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      try {
        const token = await getAccessToken();
        const response = await fetch("/api/billing/status", {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (active) setBilling(data);
      } catch {
        if (active) setBilling(null);
      }
    }

    loadBilling();
    return () => {
      active = false;
    };
  }, [getAccessToken, user?.id]);

  const planName = billing?.planName || "Free";
  const remaining = billing?.remainingCredits ?? 5;
  const total = billing?.monthlyCredits ?? 5;
  const remainingWidth = Math.max(0, Math.min(100, (remaining / Math.max(1, total)) * 100));

  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.04] ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-400">
            <ShieldCheck size={15} />
            Plan
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{planName}</h2>
        </div>
        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
          {billing?.status || (authConfigured ? "free" : "demo")}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Gauge size={14} />
            Credits
          </span>
          <span>{remaining}/{total} left</span>
        </div>
        <div className="credit-meter h-2 rounded-full bg-slate-800" aria-label={`${remaining} of ${total} credits remaining`}>
          <div className="credit-meter__fill h-2 rounded-full bg-cyan-300" style={{ width: `${remainingWidth}%` }} />
        </div>
      </div>

      {billing?.customerPortalUrl ? (
        <a
          href={billing.customerPortalUrl}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
        >
          <CreditCard size={16} />
          Manage billing
        </a>
      ) : null}

      {billing?.message ? <p className="mt-3 text-xs leading-5 text-slate-500">{billing.message}</p> : null}
    </section>
  );
}
