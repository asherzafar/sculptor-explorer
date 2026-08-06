"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/timeline", label: "Timeline" },
  { href: "/explore", label: "Explore" },
  { href: "/evolution", label: "Evolution" },
  { href: "/migration", label: "Migration" },
  { href: "/lineage", label: "Lineage" },
  { href: "/about", label: "About" },
  { href: "/transparency", label: "Transparency" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col bg-bg-sidebar">
      <div className="px-5 py-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold text-sidebar-text focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent-primary"
        >
          Sculpture in Data
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "font-body min-h-9 px-3 py-2 text-sm transition-colors rounded-r-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
              pathname === item.href
                ? "text-sidebar-text font-medium border-l-[3px] border-accent-primary bg-accent-muted-dark"
                : "text-sidebar-text-muted hover:text-sidebar-text hover:bg-accent-muted-dark border-l-[3px] border-transparent"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
