import Link from "next/link";
import { formatDistanceStrict } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import type { QuickMatch } from "@/lib/domain/quick-match";
import type { JobAd } from "@/lib/jobs/platsbanken";
import { ImportJobButtons } from "./import-job-buttons";

interface JobAdCardProps {
  ad: JobAd;
  quick: QuickMatch | null;
  savedApplicationId: string | undefined;
  canMatch: boolean;
  now: Date;
}

const SNIPPET_LENGTH = 220;

function snippet(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > SNIPPET_LENGTH ? `${flat.slice(0, SNIPPET_LENGTH).trimEnd()}…` : flat;
}

function quickTone(percent: number): string {
  if (percent >= 50) return "bg-emerald-500";
  if (percent >= 25) return "bg-amber-500";
  return "bg-rose-400";
}

export function JobAdCard({ ad, quick, savedApplicationId, canMatch, now }: JobAdCardProps) {
  const meta = [ad.employer, ad.location, ad.employmentType].filter(Boolean).join(" · ");

  return (
    <article className="grid gap-3 rounded-xl border p-4">
      <header className="grid gap-0.5">
        <h3 className="font-medium">{ad.title}</h3>
        <p className="text-muted-foreground text-sm">{meta}</p>
        <p className="text-muted-foreground text-xs">
          {[
            ad.publishedAt && `Publicerad ${formatDistanceStrict(ad.publishedAt, now, { addSuffix: true, locale: sv })}`,
            ad.deadline && `Sista dag ${formatDate(ad.deadline)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {quick && (
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full" aria-hidden>
              <div className={cn("h-full rounded-full", quickTone(quick.percent))} style={{ width: `${quick.percent}%` }} />
            </div>
            <span className="text-muted-foreground">
              {quick.matched.length} av {quick.matched.length + quick.missing.length} av dina kompetenser nämns
            </span>
          </div>
          {quick.matched.length > 0 && (
            <ul className="flex flex-wrap gap-1" aria-label="Kompetenser som nämns">
              {quick.matched.map((skill) => (
                <li key={skill} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {ad.description && <p className="text-muted-foreground text-sm">{snippet(ad.description)}</p>}

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          Visa i Platsbanken <ExternalLink className="size-3.5" aria-hidden />
        </a>
        {savedApplicationId ? (
          <Link href={`/applications/${savedApplicationId}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Sparad – öppna <ArrowRight aria-hidden />
          </Link>
        ) : (
          <ImportJobButtons adId={ad.id} canMatch={canMatch} />
        )}
      </footer>
    </article>
  );
}
