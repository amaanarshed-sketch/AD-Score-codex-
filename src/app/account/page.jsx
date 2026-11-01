"use client";

import Link from "next/link";
import AuthCard from "../../components/AuthCard";
import BillingStatus from "../../components/BillingStatus";
import Navbar from "../../components/Navbar";

const setupSteps = [
  ["Supabase Auth", "Add the Supabase URL, anon key and service role key to enable accounts."],
  ["Google login", "Enable Google under Supabase Auth providers and add your live URL to the redirect settings."],
  ["Lemon Squeezy", "Add the store ID, API key, webhook secret and Plus/Pro variant IDs to open checkout."],
  ["Credit tables", "Run the included SQL schema in Supabase before using live credits."],
];

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <main className="shell page">
        <section className="page-head">
          <div>
            <p className="eyebrow">Account & billing</p>
            <h1 className="h1">Your plan, credits and access.</h1>
            <p className="lede">Sign in, check how many credits are left this period, and manage your subscription.</p>
          </div>
          <Link href="/pricing" className="btn">View plans</Link>
        </section>

        <section className="section grid-auto" style={{ "--min": "320px" }}>
          <AuthCard />
          <BillingStatus />
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">Setup checklist</h2>
            <span className="meta">FOR THE SITE OWNER</span>
          </div>
          <ol className="numbered rule-top" style={{ paddingTop: 18 }}>
            {setupSteps.map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span><strong style={{ fontWeight: 500 }}>{title}.</strong> <span style={{ color: "var(--ink2)" }}>{copy}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
