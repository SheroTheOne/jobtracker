"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveProfileAction, type CvUploadResult, type ProfileFormState } from "@/lib/actions/profile";
import { SENIORITY_LABELS, SENIORITY_LEVELS } from "@/lib/domain/seniority";
import { CV_MAX_LENGTH, type ProfileFormValues } from "@/lib/validation/profile";
import { formatStringList } from "@/lib/validation/string-list";
import { CvUpload } from "./cv-upload";
import { StringListPreview } from "./string-list-preview";

const INITIAL_STATE: ProfileFormState = { status: "idle" };

type UploadSuccess = Extract<CvUploadResult, { ok: true }>;

/**
 * Applicerar ett uppladdat CV på formuläret. CV-texten ersätts alltid; AI-förslagen fyller
 * tomma fält – eller alla fält om profilen inte sparats tidigare.
 */
function applyUpload(current: ProfileFormValues, upload: UploadSuccess, isNewProfile: boolean): ProfileFormValues {
  const next = { ...current, cvText: upload.text };
  const s = upload.suggestion;
  if (!s) return next;

  const fill = (field: keyof ProfileFormValues, value: string): void => {
    if (value && (isNewProfile || !current[field].trim())) next[field] = value;
  };
  fill("fullName", s.fullName);
  fill("headline", s.headline);
  fill("targetRoles", formatStringList(s.targetRoles));
  fill("coreSkills", formatStringList(s.coreSkills));
  if (isNewProfile) next.seniority = s.seniority;
  return next;
}

interface ProfileFormProps {
  defaultValues: ProfileFormValues;
  isNewProfile: boolean;
}

export function ProfileForm(props: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfileAction, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  const initialValues = state.status === "error" ? state.values : props.defaultValues;
  // Ny nyckel vid nytt serverresultat → formuläret startar om från rätt värden.
  const formKey = state.status === "success" ? state.savedAt : state.status === "error" ? JSON.stringify(state.values) : 0;

  return (
    <ProfileFields
      key={formKey}
      initialValues={initialValues}
      isNewProfile={props.isNewProfile && state.status !== "success"}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}

interface ProfileFieldsProps {
  initialValues: ProfileFormValues;
  isNewProfile: boolean;
  state: ProfileFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}

function ProfileFields({ initialValues, isNewProfile, state, formAction, pending }: ProfileFieldsProps) {
  const [values, setValues] = useState(initialValues);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const errors = state.status === "error" ? state.fieldErrors : {};

  const set =
    (field: keyof ProfileFormValues) =>
    (event: { target: { value: string } }): void =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-1">
        <CvUpload
          onLoaded={(upload) => {
            setValues((prev) => applyUpload(prev, upload, isNewProfile));
            setLoadedFile(upload.fileName);
          }}
        />
        {loadedFile && <p className="text-muted-foreground text-xs">Inläst från {loadedFile} – inte sparat än.</p>}
      </div>

      {state.status === "error" && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label="Namn" errors={errors.fullName}>
          {(p) => <Input {...p} name="fullName" value={values.fullName} onChange={set("fullName")} autoComplete="name" />}
        </Field>
        <Field id="seniority" label="Senioritet" errors={errors.seniority}>
          {({ id, ...p }) => (
            <Select
              name="seniority"
              value={values.seniority}
              onValueChange={(next) => typeof next === "string" && setValues((prev) => ({ ...prev, seniority: next }))}
              items={SENIORITY_LABELS}
            >
              <SelectTrigger id={id} {...p} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {SENIORITY_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      <Field id="headline" label="Rubrik" errors={errors.headline} hint="En mening om vem du är, t.ex. din LinkedIn-rubrik.">
        {(p) => <Input {...p} name="headline" value={values.headline} onChange={set("headline")} />}
      </Field>

      <div className="grid gap-2">
        <Field id="targetRoles" label="Roller du söker" errors={errors.targetRoles} hint="Används som sökord under Hitta jobb. Separera med komma.">
          {(p) => <Textarea {...p} name="targetRoles" rows={2} value={values.targetRoles} onChange={set("targetRoles")} />}
        </Field>
        <StringListPreview value={values.targetRoles} />
      </div>

      <div className="grid gap-2">
        <Field id="coreSkills" label="Kärnkompetenser" errors={errors.coreSkills} hint="Används för snabbmatchning mot annonser. Separera med komma.">
          {(p) => <Textarea {...p} name="coreSkills" rows={3} value={values.coreSkills} onChange={set("coreSkills")} />}
        </Field>
        <StringListPreview value={values.coreSkills} />
      </div>

      <div className="grid gap-1">
        <Field id="cvText" label="CV-text" errors={errors.cvText} hint="Fylls i från uppladdningen. Du kan också klistra in eller justera texten här.">
          {(p) => (
            <Textarea {...p} name="cvText" rows={16} value={values.cvText} onChange={set("cvText")} className="font-mono text-xs" />
          )}
        </Field>
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {values.cvText.length.toLocaleString("sv-SE")} / {CV_MAX_LENGTH.toLocaleString("sv-SE")}
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Spara profil
        </Button>
      </div>
    </form>
  );
}
