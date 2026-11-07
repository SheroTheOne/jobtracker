"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Field } from "@/components/forms/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationFormState } from "@/lib/actions/applications";
import { STATUS_LABELS } from "@/lib/domain/application-status";
import type { ApplicationFormValues } from "@/lib/validation/application";
import { StatusSelectContent } from "./status-select-content";

type FormAction = (state: ApplicationFormState, formData: FormData) => Promise<ApplicationFormState>;

interface ApplicationFormProps {
  action: FormAction;
  defaultValues: ApplicationFormValues;
  submitLabel: string;
  cancelHref: string;
}

const INITIAL_STATE: ApplicationFormState = { status: "idle" };

export function ApplicationForm({ action, defaultValues, submitLabel, cancelHref }: ApplicationFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  // Vid valideringsfel återfylls formuläret med det användaren skickade in.
  const values = state.status === "error" ? state.values : defaultValues;
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    // key tvingar om-montering vid nytt feltillstånd så att defaultValue tillämpas på nytt.
    <form key={state.status === "error" ? JSON.stringify(values) : "initial"} action={formAction} className="grid gap-6">
      {state.status === "error" && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="company" label="Företag" errors={errors.company}>
          {(p) => <Input {...p} name="company" defaultValue={values.company} required autoComplete="organization" />}
        </Field>
        <Field id="role" label="Roll" errors={errors.role}>
          {(p) => <Input {...p} name="role" defaultValue={values.role} required />}
        </Field>
      </div>

      <Field id="url" label="Länk till annons" errors={errors.url}>
        {(p) => <Input {...p} name="url" type="url" inputMode="url" placeholder="https://" defaultValue={values.url} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="status" label="Status" errors={errors.status}>
          {({ id, ...p }) => (
            <Select name="status" defaultValue={values.status} items={STATUS_LABELS}>
              <SelectTrigger id={id} {...p} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <StatusSelectContent />
            </Select>
          )}
        </Field>
        <Field id="appliedDate" label="Ansökningsdatum" errors={errors.appliedDate} hint="Sätts automatiskt om tomt">
          {(p) => <Input {...p} name="appliedDate" type="date" defaultValue={values.appliedDate} />}
        </Field>
        <Field id="followUpDate" label="Påminnelse" errors={errors.followUpDate} hint="Ersätter 7-dagarsregeln">
          {(p) => <Input {...p} name="followUpDate" type="date" defaultValue={values.followUpDate} />}
        </Field>
      </div>

      <Field
        id="jobDescriptionText"
        label="Annonstext"
        errors={errors.jobDescriptionText}
        hint="Klistra in hela annonsen – används för AI-matchningen."
      >
        {(p) => (
          <Textarea {...p} name="jobDescriptionText" rows={10} defaultValue={values.jobDescriptionText} className="font-mono text-xs" />
        )}
      </Field>

      <Field id="notes" label="Anteckningar" errors={errors.notes}>
        {(p) => <Textarea {...p} name="notes" rows={4} defaultValue={values.notes} />}
      </Field>

      <div className="flex items-center justify-end gap-2">
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost" })}>
          Avbryt
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
