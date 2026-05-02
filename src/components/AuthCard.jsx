"use client";

import { useState } from "react";
import { CheckCircle2, LogIn, LogOut, UserPlus } from "lucide-react";
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
      <section className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-amber-200">Auth not configured</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Add the Supabase environment variables in Vercel to enable accounts, paid checkout, and credit tracking.
        </p>
      </section>
    );
  }

  if (loading) {
    return <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">Checking account...</section>;
  }

  if (user) {
    const metadata = user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || metadata.picture || "";
    const displayName = metadata.full_name || metadata.name || user.email?.split("@")[0] || "Adnex user";
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Account</h2>
        <div className="mt-4 flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white text-xl font-black text-slate-950">
            {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-white">{displayName}</p>
            <p className="mt-1 break-all text-sm text-slate-400">{user.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-black text-emerald-200">
              <CheckCircle2 size={13} />
              Signed in
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex gap-2">
        {[
          ["signin", "Sign in", LogIn],
          ["signup", "Sign up", UserPlus],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition ${
              mode === key ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={googleLogin}
        disabled={busy}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="font-black">G</span>
        Continue with Google
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
        <span className="h-px flex-1 bg-white/10" />
        Email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-200">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="app-control w-full rounded-lg border p-3 text-sm outline-none transition"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-200">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="app-control w-full rounded-lg border p-3 text-sm outline-none transition"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {message ? <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">{message}</p> : null}
    </section>
  );
}
