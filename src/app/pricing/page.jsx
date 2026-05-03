import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import BillingStatus from "../../components/BillingStatus";
import CheckoutButton from "../../components/CheckoutButton";
import Navbar from "../../components/Navbar";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "For validating your first few text ads",
    cta: "Start free",
    href: "/dashboard",
    badge: "Live now",
    available: true,
    featured: false,
    features: [
      "5 text/link analyses per month",
      "Compare 2 ads side-by-side",
      "Image upload preview only",
      "Local browser history",
    ],
  },
  {
    name: "Plus",
    price: "$15",
    note: "For solo marketers testing ads every week",
    cta: "Join early access",
    badge: "Checkout ready",
    available: true,
    featured: true,
    features: [
      "150 credits per month",
      "AI image analysis included",
      "Video Hook Audit included",
      "Compare up to 4 ads",
      "Creative recommendations",
      "Saved analysis history",
    ],
  },
  {
    name: "Pro",
    price: "$39",
    note: "For teams and agencies running repeat tests",
    cta: "Join early access",
    badge: "Checkout ready",
    available: true,
    featured: false,
    features: [
      "750 credits per month",
      "Everything in Plus",
      "Higher-volume Video Hook Audits",
      "Campaign folders",
      "Brand and audience presets",
      "Exportable reports",
      "Winning ads library",
    ],
  },
];

export const metadata = {
  title: "Pricing | Adnex",
  description: "Simple early pricing for Adnex, the AI ad evaluation tool for marketers.",
};

export default function PricingPage() {
  return (
    <main className="app-page min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="app-pricing-eyebrow mb-5 inline-flex items-center rounded-full px-4 py-2 text-sm font-black">
            Early pricing with Lemon Squeezy checkout
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Costs less than one bad ad test.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Start free while we validate the product. Upgrade when you need paid creative audits and more monthly credits.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Video Hook Audit costs 8 credits because it uses multiple sampled key frames to judge scroll-stop potential and offer visibility.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <AuthCard />
          <BillingStatus />
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`pricing-plan-card app-card rounded-xl border p-6 ${
                plan.featured
                  ? "pricing-plan-card--featured border-cyan-300/50 bg-cyan-300/[0.07] shadow-2xl shadow-cyan-950/20"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black">{plan.name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.badge === "Live now" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-slate-300"}`}>
                  {plan.badge}
                </span>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className="pb-2 text-sm font-semibold text-slate-500">/ month</span>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.note}</p>

              {plan.name === "Free" ? (
                <Link
                  href="/dashboard"
                  className="app-secondary-action mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <CheckoutButton plan={plan.name.toLowerCase()} featured={plan.featured}>
                  Upgrade to {plan.name}
                </CheckoutButton>
              )}

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <Check className="mt-1 shrink-0 text-cyan-300" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="pricing-note app-card mt-8 rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Clock className="mt-1 shrink-0 text-cyan-300" size={20} />
              <div>
                <h2 className="font-black">When payments turn on</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Checkout uses Lemon Squeezy in test mode by default. Add the Lemon Squeezy and Supabase environment variables in Vercel before accepting real payments.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="app-primary-action app-floating-action inline-flex shrink-0 items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
              Try Adnex
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
