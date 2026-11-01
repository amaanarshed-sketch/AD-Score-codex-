"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div style={{ display: "grid", gap: 10 }}>
      <button type="button" onClick={checkout} disabled={loading} className={`btn btn--block btn--lg ${featured ? "btn--accent" : "btn--primary"}`}>
        {loading ? <Loader2 className="spin" size={16} /> : null}
        {loading ? "Opening checkout…" : <>{children} →</>}
      </button>
      {error ? <p className="notice notice--warn">{error}</p> : null}
    </div>
  );
}
