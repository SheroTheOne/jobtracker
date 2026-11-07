import type { Metadata } from "next";
import { ApplicationForm } from "@/components/applications/application-form";
import { PageHeader } from "@/components/layout/page-header";
import { createApplicationAction } from "@/lib/actions/applications";
import type { ApplicationFormValues } from "@/lib/validation/application";

export const metadata: Metadata = { title: "Ny ansökan" };

const EMPTY_VALUES: ApplicationFormValues = {
  company: "",
  role: "",
  url: "",
  jobDescriptionText: "",
  status: "SAVED",
  appliedDate: "",
  followUpDate: "",
  notes: "",
};

export default function NewApplicationPage() {
  return (
    <>
      <PageHeader title="Ny ansökan" description="Spara en annons eller registrera en ansökan du har skickat." />
      <ApplicationForm
        action={createApplicationAction}
        defaultValues={EMPTY_VALUES}
        submitLabel="Spara ansökan"
        cancelHref="/applications"
      />
    </>
  );
}
