"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { SENIORITY_LABELS, SENIORITY_LEVELS } from "@/lib/domain/seniority";
import { CV_MAX_LENGTH, type ProfileFormValues } from "@/lib/validation/profile";
import { StringListPreview } from "./string-list-preview";

const INITIAL_STATE: ProfileFormState = { status: "idle" };

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(saveProfileAction, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  const values = state.status === "error" ? state.values : defaultValues;
  const errors = state.status === "error" ? state.fieldErrors : {};
  // Om-montera vid nytt resultat så att defaultValue speglar det som sparats eller skickats in.
  const formKey = state.status === "success" ? state.savedAt : state.status === "error" ? JSON.stringify(values) : 0;

  return (
    <form key={formKey} action={formAction} className="grid gap-6">
      {state.status === "error" && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label="Namn" errors={errors.fullName}>
          {(p) => <Input {...p} name="fullName" defaultValue={values.fullName} autoComplete="name" />}
        </Field>
        <Field id="seniority" label="Senioritet" errors={errors.seniority}>
          {({ id, ...p }) => (
            <Select name="seniority" defaultValue={values.seniority} items={SENIORITY_LABELS}>
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
        {(p) => <Input {...p} name="headline" defaultValue={values.headline} />}
      </Field>

      <ListField
        id="targetRoles"
        label="Roller du söker"
        hint="Separera med komma eller ny rad."
        defaultValue={values.targetRoles}
        errors={errors.targetRoles}
        rows={2}
      />

      <ListField
        id="coreSkills"
        label="Kärnkompetenser"
        hint="Tekniker, verktyg och områden du vill lyfta – separera med komma."
        defaultValue={values.coreSkills}
        errors={errors.coreSkills}
        rows={3}
      />

      <CvField defaultValue={values.cvText} errors={errors.cvText} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Spara profil
        </Button>
      </div>
    </form>
  );
}

interface ListFieldProps {
  id: "targetRoles" | "coreSkills";
  label: string;
  hint: string;
  defaultValue: string;
  errors?: string[];
  rows: number;
}

function ListField({ id, label, hint, defaultValue, errors, rows }: ListFieldProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="grid gap-2">
      <Field id={id} label={label} errors={errors} hint={hint}>
        {(p) => <Textarea {...p} name={id} rows={rows} value={value} onChange={(e) => setValue(e.target.value)} />}
      </Field>
      <StringListPreview value={value} />
    </div>
  );
}

function CvField({ defaultValue, errors }: { defaultValue: string; errors?: string[] }) {
  const [length, setLength] = useState(defaultValue.length);
  return (
    <div className="grid gap-1">
      <Field id="cvText" label="CV" errors={errors} hint="Klistra in hela CV:t som text eller markdown. Det används som underlag för AI-matchningen.">
        {(p) => (
          <Textarea
            {...p}
            name="cvText"
            rows={20}
            defaultValue={defaultValue}
            onChange={(e) => setLength(e.target.value.length)}
            className="font-mono text-xs"
          />
        )}
      </Field>
      <p className="text-muted-foreground text-right text-xs tabular-nums">
        {length.toLocaleString("sv-SE")} / {CV_MAX_LENGTH.toLocaleString("sv-SE")}
      </p>
    </div>
  );
}
