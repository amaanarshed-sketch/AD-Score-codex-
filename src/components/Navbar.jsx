"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/dashboard", label: "Analyze" },
  { href: "/compare", label: "Compare" },
  { href: "/history", label: "Reports", also: ["/results"] },
  { href: "/pricing", label: "Plans" },
];

function initials(name = "") {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "A";
}

export function BrandLink() {
  return (
    <Link href="/" aria-label="Adnex home" className="brand">
      <span className="brand__mark" aria-hidden="true" />
      Adnex
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname() || "";
  const { configured, user, loading } = useAuth();
  const metadata = user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || user?.email?.split("@")[0] || "";

  function isActive(link) {
    return [link.href, ...(link.also || [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
  }

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <BrandLink />
        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="topbar__actions">
          <ThemeToggle />
          {configured && !loading ? (
            user ? (
              <Link href="/account" className="avatar" aria-label={`Account for ${displayName}`} title={displayName}>
                {initials(displayName)}
              </Link>
            ) : (
              <Link href="/account" className="signin-link">Sign in</Link>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
}
