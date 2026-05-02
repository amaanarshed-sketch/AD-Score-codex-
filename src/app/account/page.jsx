"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Database, KeyRound } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import BillingStatus from "../../components/BillingStatus";
import Navbar from "../../components/Navbar";

export default function AccountPage() {
  return (
    <main className="app-page min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Account & Billing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Control access before AI spend starts.</h1>
          <p className="mt-3 text-slate-400">
            Accounts, subscription state, and credits sit here so paid AI can be turned on without exposing open-ended API costs.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <AuthCard />
            <BillingStatus />
          </div>

          <section className="app-card rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Setup checklist</h2>
            <div className="mt-5 grid gap-4">
              {[
                [KeyRound, "Supabase Auth", "Add Supabase URL, anon key, and service role key to enable accounts."],
                [KeyRound, "Google login", "Enable Google under Supabase Auth Providers and add your live URL to redirect settings."],
                [CreditCard, "Lemon Squeezy", "Add store, API, webhook secret, and Plus/Pro variant IDs to open checkout."],
                [Database, "Credit tables", "Run the included SQL schema in Supabase before using live credits."],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="setup-check-card rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <p className="flex items-center gap-2 font-black text-white">
                    <Icon size={17} className="text-cyan-300" />
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="app-primary-action mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
              View plans
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
