"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importJobFromUrlAction } from "@/lib/actions/jobs";

export function PlatsbankenLinkImport() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await importJobFromUrlAction(url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(result.alreadySaved ? "Annonsen var redan sparad" : "Annonsen är hämtad och sparad");
      router.push(`/applications/${result.applicationId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/40 grid gap-2 rounded-xl border p-4">
      <label htmlFor="platsbanken-url" className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="size-4" aria-hidden />
        Snabbast: klistra in en länk från Platsbanken
      </label>
      <div className="flex gap-2">
        <Input
          id="platsbanken-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://arbetsformedlingen.se/platsbanken/annonser/…"
          inputMode="url"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "platsbanken-url-error" : undefined}
          className="bg-background flex-1"
        />
        <Button type="submit" disabled={pending || !url.trim()}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Hämta
        </Button>
      </div>
      {error ? (
        <p id="platsbanken-url-error" className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">Företag, roll och hela annonstexten fylls i automatiskt.</p>
      )}
    </form>
  );
}
