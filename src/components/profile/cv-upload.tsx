"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { uploadCvAction, type CvUploadResult } from "@/lib/actions/profile";
import { UPLOAD_ACCEPT } from "@/lib/documents/constants";

type UploadSuccess = Extract<CvUploadResult, { ok: true }>;

export function CvUpload({ onLoaded }: { onLoaded: (result: UploadSuccess) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);

  function upload(file: File): void {
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadCvAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onLoaded(result);
      if (result.suggestionError) toast.warning(`CV-texten hämtades, men fälten kunde inte fyllas i: ${result.suggestionError}`);
      else toast.success("CV:t är inläst – granska fälten och spara.");
    });
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !pending) upload(file);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={pending}
        className={cn(
          "hover:bg-muted/50 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors disabled:cursor-wait",
          dragging && "border-primary bg-muted/50",
        )}
      >
        {pending ? (
          <>
            <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
            <span className="text-sm font-medium">Läser CV:t och fyller i profilen…</span>
          </>
        ) : (
          <>
            <FileUp className="text-muted-foreground size-6" aria-hidden />
            <span className="text-sm font-medium">Ladda upp ditt CV</span>
            <span className="text-muted-foreground text-xs">
              PDF, Word (.docx), Markdown eller text · dra hit eller klicka · fälten fylls i automatiskt
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // samma fil ska kunna väljas igen
          if (file) upload(file);
        }}
      />
    </>
  );
}
