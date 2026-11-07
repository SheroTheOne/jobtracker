import Link from "next/link";
import { Suspense } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { NavLinks, StaticNavLinks, type NavItem } from "./nav-link";

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Översikt", exact: true },
  { href: "/applications", label: "Ansökningar" },
  { href: "/profile", label: "Profil" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BriefcaseBusiness className="size-5" aria-hidden />
          jobtracker
        </Link>
        <nav aria-label="Huvudmeny" className="flex items-center gap-1 text-sm">
          <Suspense fallback={<StaticNavLinks items={NAV_ITEMS} />}>
            <NavLinks items={NAV_ITEMS} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
