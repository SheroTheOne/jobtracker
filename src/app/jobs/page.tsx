import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, FileUser, Search, SearchX } from "lucide-react";
import { JobAdCard } from "@/components/jobs/job-ad-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { findImportedApplications } from "@/lib/data/applications";
import { getProfile, type Profile } from "@/lib/data/profile";
import { quickMatch } from "@/lib/domain/quick-match";
import { JobSourceError, PAGE_SIZE, PLATSBANKEN_SOURCE, searchJobs, type JobSearchResult } from "@/lib/jobs/platsbanken";

export const metadata: Metadata = { title: "Hitta jobb" };

type SearchParams = PageProps<"/jobs">["searchParams"];

export default function JobsPage({ searchParams }: PageProps<"/jobs">) {
  return (
    <>
      <PageHeader
        title="Hitta jobb"
        description="Sök bland Arbetsförmedlingens annonser (Platsbanken) och se direkt hur väl de matchar dina kompetenser."
      />
      <Suspense fallback={<JobsSkeleton />}>
        <JobSearch searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function defaultQuery(profile: Profile | null): string {
  return profile?.targetRoles[0] ?? "";
}

async function JobSearch({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const profile = await getProfile();

  const query = (firstString(params.q) ?? defaultQuery(profile)).trim().slice(0, 200);
  const page = Math.max(1, Math.min(Number.parseInt(firstString(params.page) ?? "1", 10) || 1, 50));
  const sortByMatch = firstString(params.sort) === "match";

  return (
    <div className="grid gap-6">
      {!profile && (
        <Link href="/profile" className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
          <FileUser className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Lägg in ditt CV</span>
            <span className="text-muted-foreground"> för att få snabbmatchning och kunna matcha med AI.</span>
          </span>
        </Link>
      )}

      <SearchForm query={query} suggestions={profile?.targetRoles ?? []} />

      {query ? (
        <Suspense key={`${query}-${page}-${sortByMatch}`} fallback={<ResultsSkeleton />}>
          <Results query={query} page={page} sortByMatch={sortByMatch} profile={profile} />
        </Suspense>
      ) : (
        <p className="text-muted-foreground text-sm">Skriv en roll, teknik eller ort för att söka.</p>
      )}
    </div>
  );
}

function SearchForm({ query, suggestions }: { query: string; suggestions: readonly string[] }) {
  return (
    <div className="grid gap-2">
      {/* Vanligt GET-formulär: sökningen hamnar i URL:en och fungerar utan JavaScript. */}
      <form action="/jobs" className="flex gap-2" role="search">
        <Input name="q" defaultValue={query} placeholder="t.ex. fullstackutvecklare stockholm" aria-label="Sökord" className="flex-1" />
        <Button type="submit">
          <Search aria-hidden />
          Sök
        </Button>
      </form>
      {suggestions.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground">Dina roller:</span>
          {suggestions.map((role) => (
            <Link key={role} href={`/jobs?q=${encodeURIComponent(role)}`} className="hover:bg-muted rounded-full border px-2 py-0.5">
              {role}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function pageHref(query: string, page: number, sortByMatch: boolean): string {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));
  if (sortByMatch) params.set("sort", "match");
  return `/jobs?${params}`;
}

async function Results({
  query,
  page,
  sortByMatch,
  profile,
}: {
  query: string;
  page: number;
  sortByMatch: boolean;
  profile: Profile | null;
}) {
  let result: JobSearchResult;
  try {
    result = await searchJobs(query, (page - 1) * PAGE_SIZE);
  } catch (error) {
    const message = error instanceof JobSourceError ? error.message : "Sökningen misslyckades.";
    return (
      <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
        <AlertCircle className="size-4 shrink-0" aria-hidden />
        {message}
      </div>
    );
  }

  if (result.ads.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-sm">
        <SearchX className="size-6" aria-hidden />
        Inga annonser hittades för ”{query}”.
      </div>
    );
  }

  const saved = await findImportedApplications(
    PLATSBANKEN_SOURCE,
    result.ads.map((ad) => ad.id),
  );
  const now = new Date();
  const items = result.ads.map((ad) => ({
    ad,
    quick: profile ? quickMatch(profile.coreSkills, `${ad.title}\n${ad.description}`) : null,
  }));
  if (sortByMatch) items.sort((a, b) => (b.quick?.percent ?? 0) - (a.quick?.percent ?? 0));

  const totalPages = Math.min(Math.ceil(result.total / PAGE_SIZE), 50);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {result.total.toLocaleString("sv-SE")} annonser · sida {page} av {totalPages}
        </p>
        {profile && (
          <div className="flex gap-1">
            <SortLink href={pageHref(query, page, false)} active={!sortByMatch}>
              Relevans
            </SortLink>
            <SortLink href={pageHref(query, page, true)} active={sortByMatch}>
              Bäst match
            </SortLink>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {items.map(({ ad, quick }) => (
          <JobAdCard
            key={ad.id}
            ad={ad}
            quick={quick}
            savedApplicationId={saved.get(ad.id)}
            canMatch={profile !== null && ad.description.length >= 100}
            now={now}
          />
        ))}
      </div>

      <nav aria-label="Sidor" className="flex justify-between">
        {page > 1 ? (
          <Link href={pageHref(query, page - 1, sortByMatch)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Föregående
          </Link>
        ) : (
          <span />
        )}
        {page < totalPages && (
          <Link href={pageHref(query, page + 1, sortByMatch)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Nästa
          </Link>
        )}
      </nav>
    </div>
  );
}

function SortLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-1 transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-3" aria-busy aria-label="Söker annonser">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}

function JobsSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-9 w-full" />
      <ResultsSkeleton />
    </div>
  );
}
