"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runMatchAction } from "@/lib/actions/match";
import { MatchSkeleton } from "./match-skeleton";

interface MatchRunnerProps {
  applicationId: string;
  hasReport: boolean;
  /** Server-renderad rapport (eller tomt läge) som visas när ingen analys pågår. */
  children: ReactNode;
}

export function MatchRunner({ applicationId, hasReport, children }: MatchRunnerProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(): void {
    setError(null);
    startTransition(async () => {
      const result = await runMatchAction(applicationId);
      if (result.ok) toast.success("Matchningen är klar");
      else setError(result.error);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={run} disabled={pending} variant={hasReport ? "outline" : "default"}>
          {hasReport ? <RefreshCw aria-hidden className={pending ? "animate-spin" : undefined} /> : <Sparkles aria-hidden />}
          {hasReport ? "Kör igen" : "Matcha mot CV"}
        </Button>
      </div>

      {error && !pending && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="grid gap-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={run} className="w-fit">
              Försök igen
            </Button>
          </div>
        </div>
      )}

      {pending ? <MatchSkeleton /> : children}
    </div>
  );
}
