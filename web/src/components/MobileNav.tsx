"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * MobileNav — top bar shown below the `md` breakpoint, where the
 * desktop sidebar (`Nav`) is hidden.
 *
 * Design intent:
 * - The desktop sidebar is the canonical navigation; mobile is a
 *   read-only fallback. So the mobile nav shows the same six routes,
 *   not a curated subset. Pages that don't render meaningfully on a
 *   phone (lineage, evolution) gate themselves with `<MobileNotice />`
 *   rather than disappearing from the nav — being honest about what
 *   exists is part of the project's voice.
 * - Pills horizontally scroll on overflow rather than collapse into a
 *   hamburger. Six items fit on a phone, and a hamburger drawer adds
 *   tap-and-state machinery for no real navigation gain.
 * - Compact bar height matches the desktop sidebar header rhythm
 *   (~56px) so the page below starts at the same vertical position
 *   the desktop user sees.
 */
const navItems = [
  { href: "/timeline", label: "Timeline" },
  { href: "/explore", label: "Explore" },
  { href: "/evolution", label: "Evolution" },
  { href: "/lineage", label: "Lineage" },
  { href: "/about", label: "About" },
  { href: "/transparency", label: "Transparency" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-bg-sidebar text-sidebar-text">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <Link
          href="/"
          className="font-display text-base font-semibold text-sidebar-text"
        >
          Sculpture in Data
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-accent-primary text-white"
                  : "text-sidebar-text-muted hover:text-sidebar-text hover:bg-accent-muted-dark"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
