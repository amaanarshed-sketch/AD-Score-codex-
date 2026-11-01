"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

export default function BillingStatus() {
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
  const ratio = Math.max(0, Math.min(1, remaining / Math.max(1, total)));

  return (
    <section className="panel" style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">Plan</p>
          <h2 className="h3">{planName}</h2>
        </div>
        <span className="chip chip--on">{billing?.status || (authConfigured ? "free" : "demo")}</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="eyebrow">Credits left</span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 500 }}>{remaining}<span style={{ fontSize: 12, color: "var(--ink3)" }}>/{total}</span></span>
        </div>
        <div className="track" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={remaining} aria-label="Credits remaining">
          <div style={{ width: `${ratio * 100}%`, background: ratio < 0.2 ? "var(--rej)" : "var(--ink)" }} />
        </div>
        {billing?.periodEnd ? <p className="meta">RESETS {new Date(billing.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</p> : null}
      </div>

      {billing?.customerPortalUrl ? <a href={billing.customerPortalUrl} className="btn">Manage billing</a> : null}
      {billing?.message ? <p className="hint">{billing.message}</p> : null}
    </section>
  );
}
