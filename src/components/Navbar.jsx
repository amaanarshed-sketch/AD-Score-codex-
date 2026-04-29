import Link from "next/link";

function AdnexMark({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="9" fill="url(#adnex-mark-fill)" />
      <path d="M13 25.5 19.2 12.8c.32-.66 1.26-.66 1.58 0L27 25.5" stroke="#050505" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.6 21.4h8.8" stroke="#050505" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M27.6 13.4h1.8m-3 4h4.2m-3 4h1.8" stroke="#050505" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="adnex-mark-fill" x1="9" y1="7" x2="31" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C9CED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center">
            <AdnexMark className="h-9 w-9 drop-shadow-[0_18px_38px_rgba(255,255,255,0.16)]" />
          </span>
          <span className="text-lg font-black tracking-tight text-white">Adnex</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
            Dashboard
          </Link>
          <Link href="/history" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white md:inline-flex">
            History
          </Link>
          <Link href="/account" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex">
            Account
          </Link>
          <Link href="/compare" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
