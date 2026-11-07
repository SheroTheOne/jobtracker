import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, FileUser, Plus } from "lucide-react";
import { FollowUpBadge } from "@/components/applications/follow-up-badge";
import { StatusBadge } from "@/components/applications/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications } from "@/lib/data/applications";
import { getProfile } from "@/lib/data/profile";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/domain/application-status";
import { getFollowUpState } from "@/lib/domain/follow-up";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Översikt"
        description="Status för dina ansökningar och vad som behöver följas upp."
        actions={
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Ny ansökan
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const [applications, profile] = await Promise.all([listApplications(), getProfile()]);
  const now = new Date();

  const counts = APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((a) => a.status === status).length,
  }));

  const followUps = applications
    .map((application) => ({ application, state: getFollowUpState(application, now) }))
    .filter(({ state }) => state.needsFollowUp);

  return (
    <>
      {!profile && (
        <Link
          href="/profile"
          className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm transition-colors"
        >
          <FileUser className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Lägg in ditt CV</span>
            <span className="text-muted-foreground"> – det behövs för att matcha annonser med AI.</span>
          </span>
        </Link>
      )}

      <section aria-label="Antal per status" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map(({ status, count }) => (
          <Link
            key={status}
            href={`/applications?status=${status}`}
            className="hover:bg-muted/50 rounded-xl border p-4 transition-colors"
          >
            <div className="text-2xl font-semibold tabular-nums">{count}</div>
            <div className="text-muted-foreground text-sm">{STATUS_LABELS[status]}</div>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Behöver uppföljning</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
              {applications.length === 0
                ? "Inga ansökningar än – lägg till din första."
                : "Inget att följa upp just nu."}
            </p>
          ) : (
            <ul className="divide-y">
              {followUps.map(({ application, state }) => (
                <li key={application.id}>
                  <Link
                    href={`/applications/${application.id}`}
                    className="hover:bg-muted/50 -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{application.company}</div>
                      <div className="text-muted-foreground truncate text-xs">{application.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={application.status} />
                      <FollowUpBadge state={state} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-8" aria-busy aria-label="Laddar översikt">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {APPLICATION_STATUSES.map((status) => (
          <Skeleton key={status} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
