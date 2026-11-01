"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthCard() {
  const { configured, user, loading, signIn, signInWithGoogle, signOut, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const data = await signUp(email, password);
        if (data.session) {
          setMessage("Account created and signed in.");
        } else {
          setMessage("Account created. Check your inbox and confirm your email to finish signing in.");
        }
      } else {
        await signIn(email, password);
        setMessage("Signed in.");
      }
    } catch (error) {
      setMessage(error.message || "Auth failed.");
    } finally {
      setBusy(false);
    }
  }

  async function googleLogin() {
    setBusy(true);
    setMessage("");
    try {
      await signInWithGoogle();
      setMessage("Redirecting to Google...");
    } catch (error) {
      setMessage(error.message || "Google login failed.");
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <p className="eyebrow tone-rev">Accounts not configured</p>
        <p className="small">Add the Supabase environment variables to turn on accounts, paid checkout and credit tracking.</p>
      </section>
    );
  }

  if (loading) {
    return <section className="panel"><p className="meta">CHECKING ACCOUNT…</p></section>;
  }

  if (user) {
    const metadata = user.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || user.email?.split("@")[0] || "Adnex user";

    return (
      <section className="panel" style={{ display: "grid", gap: 20 }}>
        <p className="eyebrow">Account</p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <span className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{displayName.charAt(0).toUpperCase()}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>{displayName}</p>
            <p className="meta" style={{ overflowWrap: "anywhere" }}>{user.email}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="btn btn--block">Sign out</button>
      </section>
    );
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }} role="tablist">
        {[
          ["signin", "Sign in"],
          ["signup", "Create account"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            style={{
              background: "none",
              border: 0,
              borderBottom: `2px solid ${mode === key ? "var(--ink)" : "transparent"}`,
              color: mode === key ? "var(--ink)" : "var(--ink3)",
              padding: "8px 0",
              marginRight: 20,
              marginBottom: -1,
              font: "500 14px var(--sans)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button type="button" onClick={googleLogin} disabled={busy} className="btn btn--block">
        Continue with Google
      </button>

      <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ height: 1, flex: 1, background: "var(--line)" }} />
        or email
        <span style={{ height: 1, flex: 1, background: "var(--line)" }} />
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label className="field">
          <span className="field__label">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input" />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
          />
        </label>
        <button type="submit" disabled={busy} className="btn btn--primary btn--block btn--lg">
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
