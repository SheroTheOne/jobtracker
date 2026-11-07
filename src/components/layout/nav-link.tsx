"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

function isActive(pathname: string | null, { href, exact }: NavItem): boolean {
  if (!pathname) return false;
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavItemLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2.5 py-1.5 transition-colors",
        active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

/** Statisk variant utan aktiv markering – används som Suspense-fallback i det prerenderade skalet. */
export function StaticNavLinks({ items }: { items: readonly NavItem[] }) {
  return items.map((item) => <NavItemLink key={item.href} item={item} active={false} />);
}

/** Läser aktuell sökväg (runtime-data) – måste renderas inom <Suspense>. */
export function NavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  return items.map((item) => <NavItemLink key={item.href} item={item} active={isActive(pathname, item)} />);
}
