"use client";

import { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function AuthCard() {
  const { configured, user, loading, signIn, signOut, signUp } = useAuth();
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
        await signUp(email, password);
        setMessage("Account created. Check your inbox if email confirmation is enabled.");
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
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Account</h2>
        <p className="mt-3 break-all text-sm font-bold text-white">{user.email}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
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

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-200">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
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
            className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
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
