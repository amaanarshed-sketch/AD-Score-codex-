"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

function AdnexMark({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <rect x="1" y="1" width="46" height="46" rx="13" fill="var(--surface-elevated)" />
      <rect x="1" y="1" width="46" height="46" rx="13" stroke="var(--border)" strokeWidth="1.5" />
      <path
        d="M10.5 30.2a16 16 0 1 1 27 0"
        stroke="#2563EB"
        strokeWidth="5.6"
        strokeLinecap="round"
      />
      <path d="M24 29.5 35.2 18.3" stroke="#2563EB" strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="24" cy="30" r="5.8" fill="#2563EB" />
      <circle cx="24" cy="30" r="2" fill="#1D4ED8" opacity="0.7" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { configured, user, loading } = useAuth();
  const metadata = user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || user?.email?.split("@")[0] || "Account";
  const fallbackInitial = displayName.charAt(0).toUpperCase();
  const links = [
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/history", label: "History", className: "hidden md:inline-flex" },
    { href: "/compare", label: "Compare" },
  ];

  function navLinkClass(href, extra = "") {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    return [
      "app-nav-link nav-link px-2.5 py-2 text-sm font-semibold transition",
      isActive ? "app-nav-link-active" : "",
      extra,
    ].filter(Boolean).join(" ");
  }

  return (
    <header className="app-nav">
      <div className="app-nav-inner flex min-h-[72px] items-center justify-between gap-5 px-4 py-3 sm:px-6">
        <Link href="/" className="app-logo-link flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center">
            <AdnexMark className="h-10 w-10" />
          </span>
          <span className="app-brand text-xl font-black tracking-[-0.04em]">ADNex</span>
        </Link>

        <nav className="app-nav-controls nav-scroll flex min-w-0 items-center gap-3 overflow-x-auto">
          <div className="app-nav-links flex items-center gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href, link.className)}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="app-nav-actions flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {configured && !loading ? (
              <Link
                href="/account"
                className="account-chip inline-flex h-10 items-center gap-2 px-1.5 py-1 text-sm font-bold"
                aria-label={user ? `Open account for ${displayName}` : "Sign in to Adnex"}
              >
                <span className="account-avatar flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  {user ? (
                    <span className="text-xs font-black">{fallbackInitial}</span>
                  ) : (
                    <UserRound size={15} />
                  )}
                </span>
                <span className="hidden max-w-[110px] truncate pr-1 lg:inline">{user ? displayName : "Sign in"}</span>
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
