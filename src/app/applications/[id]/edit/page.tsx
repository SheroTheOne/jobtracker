import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/applications/application-form";
import { FormSkeleton } from "@/components/applications/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { updateApplicationAction } from "@/lib/actions/applications";
import { getApplication, type ApplicationDetail } from "@/lib/data/applications";
import { toDateInputValue } from "@/lib/dates";
import type { ApplicationFormValues } from "@/lib/validation/application";

export const metadata: Metadata = { title: "Redigera ansökan" };

export default function EditApplicationPage({ params }: PageProps<"/applications/[id]/edit">) {
  return (
    <>
      <PageHeader title="Redigera ansökan" />
      <Suspense fallback={<FormSkeleton />}>
        <EditForm params={params} />
      </Suspense>
    </>
  );
}

function toFormValues(application: ApplicationDetail): ApplicationFormValues {
  return {
    company: application.company,
    role: application.role,
    url: application.url ?? "",
    jobDescriptionText: application.jobDescriptionText ?? "",
    status: application.status,
    appliedDate: toDateInputValue(application.appliedDate),
    followUpDate: toDateInputValue(application.followUpDate),
    notes: application.notes ?? "",
  };
}

async function EditForm({ params }: Pick<PageProps<"/applications/[id]/edit">, "params">) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <ApplicationForm
      action={updateApplicationAction.bind(null, application.id)}
      defaultValues={toFormValues(application)}
      submitLabel="Spara ändringar"
      cancelHref={`/applications/${application.id}`}
    />
  );
}
