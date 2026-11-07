"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractDocumentAction } from "@/lib/actions/documents";
import { UPLOAD_ACCEPT } from "@/lib/documents/constants";

interface JobDescriptionFieldProps {
  defaultValue: string;
  errors?: string[];
}

/** Annonstext som kan klistras in eller läsas in från fil (PDF, Word, Markdown, text). */
export function JobDescriptionField({ defaultValue, errors }: JobDescriptionFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File): void {
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await extractDocumentAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setValue(result.text);
      toast.success(`Annonstexten hämtades från ${result.fileName}`);
    });
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
          Ladda upp annons (PDF, Word, text)
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
      <Field
        id="jobDescriptionText"
        label="Annonstext"
        errors={errors}
        hint="Klistra in hela annonsen eller ladda upp den – används för AI-matchningen."
      >
        {(p) => (
          <Textarea
            {...p}
            name="jobDescriptionText"
            rows={10}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono text-xs"
          />
        )}
      </Field>
    </div>
  );
}
