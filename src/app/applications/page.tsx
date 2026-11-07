import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Inbox, Plus } from "lucide-react";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { ApplicationsTableSkeleton } from "@/components/applications/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  APPLICATION_SORTS,
  countApplicationsByStatus,
  listApplications,
  type ApplicationSort,
} from "@/lib/data/applications";
import { isApplicationStatus } from "@/lib/domain/application-status";

export const metadata: Metadata = { title: "Ansökningar" };

export default function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  return (
    <>
      <PageHeader
        title="Ansökningar"
        actions={
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus aria-hidden />
            Ny ansökan
          </Link>
        }
      />
      <Suspense fallback={<ApplicationsTableSkeleton />}>
        <ApplicationsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function parseSort(value: unknown): ApplicationSort {
  return (APPLICATION_SORTS as readonly unknown[]).includes(value) ? (value as ApplicationSort) : "updated";
}

async function ApplicationsList({ searchParams }: Pick<PageProps<"/applications">, "searchParams">) {
  const params = await searchParams;
  const status = isApplicationStatus(params.status) ? params.status : undefined;
  const sort = parseSort(params.sort);

  const [applications, counts] = await Promise.all([
    listApplications({ status, sort }),
    countApplicationsByStatus(),
  ]);

  return (
    <div className="grid gap-4">
      <ApplicationFilters counts={counts} activeStatus={status} sort={sort} />
      {applications.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-sm">
          <Inbox className="size-6" aria-hidden />
          {status ? "Inga ansökningar med den statusen." : "Inga ansökningar än."}
        </div>
      ) : (
        <ApplicationsTable applications={applications} now={new Date()} />
      )}
    </div>
  );
}
