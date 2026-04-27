import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
            <BarChart3 size={19} />
          </span>
          <span className="text-lg font-black tracking-tight text-white">AdScore</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white min-[420px]:inline-flex">
            Dashboard
          </Link>
          <Link href="/history" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white md:inline-flex">
            History
          </Link>
          <Link href="/compare" className="hidden rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15 sm:inline-flex">
            Compare Ads
          </Link>
        </nav>
      </div>
    </header>
  );
}
