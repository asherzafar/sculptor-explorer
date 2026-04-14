"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/timeline", label: "Timeline" },
  { href: "/evolution", label: "Trends" },
  { href: "/explore", label: "Explore" },
  { href: "/lineage", label: "Lineage" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Sculptor Explorer
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
