import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { FollowUpBadge } from "@/components/applications/follow-up-badge";
import { LogContactButton } from "@/components/applications/log-contact-button";
import { ApplicationDetailSkeleton } from "@/components/applications/skeletons";
import { StatusQuickSelect } from "@/components/applications/status-quick-select";
import { buttonVariants } from "@/components/ui/button";
import { MatchPanel } from "@/components/match/match-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getApplication } from "@/lib/data/applications";
import { formatDate } from "@/lib/dates";
import { getFollowUpState } from "@/lib/domain/follow-up";

export const metadata: Metadata = { title: "Ansökan" };

export default function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  return (
    <>
      <Link href="/applications" className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-4" aria-hidden />
        Alla ansökningar
      </Link>
      <Suspense fallback={<ApplicationDetailSkeleton />}>
        <ApplicationDetail params={params} />
      </Suspense>
    </>
  );
}

async function ApplicationDetail({ params }: Pick<PageProps<"/applications/[id]">, "params">) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const followUp = getFollowUpState(application, new Date());

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{application.company}</h1>
          <p className="text-muted-foreground">{application.role}</p>
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex w-fit items-center gap-1 text-sm underline-offset-4 hover:underline"
            >
              Visa annons <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/applications/${application.id}/edit`} className={buttonVariants({ variant: "ghost" })}>
            <Pencil aria-hidden />
            Redigera
          </Link>
          <DeleteApplicationButton id={application.id} label={`${application.company} – ${application.role}`} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusQuickSelect id={application.id} status={application.status} />
        <LogContactButton id={application.id} />
        <FollowUpBadge state={followUp} />
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm sm:grid-cols-4">
        <DateItem label="Sökt" date={application.appliedDate} />
        <DateItem label="Senaste kontakt" date={application.lastContactAt} />
        <DateItem label="Påminnelse" date={application.followUpDate} />
        <DateItem label="Skapad" date={application.createdAt} />
      </dl>

      <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
        <MatchPanel applicationId={application.id} hasJobDescription={Boolean(application.jobDescriptionText?.trim())} />
      </Suspense>

      {application.notes && (
        <TextSection title="Anteckningar">
          <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
        </TextSection>
      )}

      {application.jobDescriptionText && (
        <TextSection title="Annonstext">
          <p className="text-muted-foreground max-h-[32rem] overflow-y-auto text-sm whitespace-pre-wrap">
            {application.jobDescriptionText}
          </p>
        </TextSection>
      )}
    </div>
  );
}

function DateItem({ label, date }: { label: string; date: Date | null }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{formatDate(date)}</dd>
    </div>
  );
}

function TextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
