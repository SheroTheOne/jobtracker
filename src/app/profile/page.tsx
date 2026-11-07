import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/applications/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getProfile, type Profile } from "@/lib/data/profile";
import { formatDate } from "@/lib/dates";
import { formatStringList } from "@/lib/validation/string-list";
import type { ProfileFormValues } from "@/lib/validation/profile";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profil & CV"
        description="Underlaget som jobbannonser matchas mot. Lagras bara i din lokala databas."
      />
      <Suspense fallback={<FormSkeleton />}>
        <ProfileSection />
      </Suspense>
    </>
  );
}

function toFormValues(profile: Profile | null): ProfileFormValues {
  return {
    fullName: profile?.fullName ?? "",
    headline: profile?.headline ?? "",
    seniority: profile?.seniority ?? "MID",
    targetRoles: formatStringList(profile?.targetRoles ?? []),
    coreSkills: formatStringList(profile?.coreSkills ?? []),
    cvText: profile?.cvText ?? "",
  };
}

async function ProfileSection() {
  const profile = await getProfile();
  return (
    <div className="grid gap-2">
      {profile && <p className="text-muted-foreground text-xs">Senast sparad {formatDate(profile.updatedAt)}</p>}
      <ProfileForm defaultValues={toFormValues(profile)} />
    </div>
  );
}
