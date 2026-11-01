import Link from "next/link";
import AuthCard from "../../components/AuthCard";
import BillingStatus from "../../components/BillingStatus";
import CheckoutButton from "../../components/CheckoutButton";
import Navbar from "../../components/Navbar";

const plans = [
  {
    name: "Free",
    price: "$0",
    credits: "5 credits / month",
    note: "For validating your first few text ads.",
    features: ["Text and link analysis", "Compare 2 ads side by side", "Image upload preview only", "Reports saved in your browser"],
  },
  {
    name: "Plus",
    price: "$15",
    credits: "150 credits / month",
    note: "For solo marketers testing ads every week.",
    featured: true,
    features: ["AI image analysis", "Video Hook Audit", "Compare up to 4 ads", "Creative recommendations", "Saved analysis history"],
  },
  {
    name: "Pro",
    price: "$39",
    credits: "750 credits / month",
    note: "For teams and agencies running repeat tests.",
    features: ["Everything in Plus", "Higher-volume Video Hook Audits", "Campaign folders", "Brand and audience presets", "Exportable reports"],
  },
];

const creditCosts = [
  ["Text or link analysis", "1 credit"],
  ["Image analysis", "2 credits"],
  ["Video Hook Audit", "8 credits"],
  ["Compare", "Sum of each ad"],
];

export const metadata = {
  title: "Plans | Adnex",
  description: "Simple pricing for Adnex, the AI ad evaluation tool for marketers.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="shell page">
        <section className="page-head">
          <div>
            <p className="eyebrow">Plans</p>
            <h1 className="h1">Costs less than one bad ad test.</h1>
            <p className="lede">Start free. Upgrade when you need image and video audits and more monthly credits.</p>
          </div>
        </section>

        <section className="section">
          <div className="cells" style={{ "--min": "280px" }}>
            {plans.map((plan) => (
              <article key={plan.name} className={plan.featured ? "plan--featured" : undefined}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 className="h3">{plan.name}</h2>
                  {plan.featured ? <span className="chip chip--on">Recommended</span> : null}
                </div>
                <div>
                  <div className="price">{plan.price}<small> / month</small></div>
                  <p className="meta" style={{ marginTop: 8 }}>{plan.credits.toUpperCase()}</p>
                </div>
                <p className="small">{plan.note}</p>
                {plan.name === "Free" ? (
                  <Link href="/dashboard" className="btn btn--block btn--lg">Start free →</Link>
                ) : (
                  <CheckoutButton plan={plan.name.toLowerCase()} featured={plan.featured}>Upgrade to {plan.name}</CheckoutButton>
                )}
                <ul className="ticks">
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="h2">What a credit buys</h2>
            <span className="meta">CREDITS RESET EVERY MONTH</span>
          </div>
          <div className="checks">
            {creditCosts.map(([name, cost]) => <div key={name}><span>{name}</span><span>{cost.toUpperCase()}</span></div>)}
          </div>
          <p className="small" style={{ marginTop: 16, maxWidth: 620 }}>A Video Hook Audit costs more because it sends several key frames from the opening to the vision model.</p>
        </section>

        <section className="section grid-auto" style={{ "--min": "320px" }}>
          <AuthCard />
          <BillingStatus />
        </section>
      </main>
    </>
  );
}
