"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = ["Läser annonsen…", "Plockar ut krav och tech-stack…", "Letar belägg i ditt CV…", "Skriver pitch…"];
const STEP_MS = 4_000;

/** Laddningsvy under AI-analysen. Stegen är vägledande – anropet är ett enda request. */
export function MatchSkeleton() {
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      setSeconds(Math.floor(elapsed / 1000));
      setStep(Math.min(Math.floor(elapsed / STEP_MS), STEPS.length - 1));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-4" aria-busy aria-live="polite">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span>{STEPS[step]}</span>
        <span className="tabular-nums opacity-60">{seconds} s</span>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-24" />
    </div>
  );
}
