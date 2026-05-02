"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function CheckoutButton({ plan, children, featured = false }) {
  const { configured, user, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setError("");
    if (!configured) {
      setError("Add Supabase and Lemon Squeezy env vars before checkout can go live.");
      return;
    }
    if (!user) {
      setError("Sign in or create an account before upgrading.");
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
          featured ? "app-primary-action bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "app-secondary-action border border-white/10 bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
        {loading ? "Opening checkout..." : children}
        {!loading ? <ArrowRight size={16} /> : null}
      </button>
      {error ? <p className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">{error}</p> : null}
    </div>
  );
}
