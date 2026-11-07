"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { ApplicationSort } from "@/lib/data/applications";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/domain/application-status";

const SORT_LABELS: Record<ApplicationSort, string> = {
  updated: "Senast ändrad",
  applied: "Ansökningsdatum",
  company: "Företag A–Ö",
};

interface ApplicationFiltersProps {
  counts: Record<ApplicationStatus, number>;
  activeStatus: ApplicationStatus | undefined;
  sort: ApplicationSort;
}

export function ApplicationFilters({ counts, activeStatus, sort }: ApplicationFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  function hrefWith(key: string, value: string | undefined): string {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const tabs: { label: string; value: ApplicationStatus | undefined; count: number }[] = [
    { label: "Alla", value: undefined, count: total },
    ...APPLICATION_STATUSES.map((status) => ({ label: STATUS_LABELS[status], value: status, count: counts[status] })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Filtrera på status" className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.value === activeStatus;
          return (
            <Link
              key={tab.label}
              href={hrefWith("status", tab.value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label} <span className="tabular-nums opacity-60">{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      <Select
        value={sort}
        items={SORT_LABELS}
        onValueChange={(next) => typeof next === "string" && router.replace(hrefWith("sort", next === "updated" ? undefined : next))}
      >
        <SelectTrigger aria-label="Sortera" size="sm" className="min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as ApplicationSort[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
