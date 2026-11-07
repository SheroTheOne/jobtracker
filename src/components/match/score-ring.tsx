import { cn } from "cn";

function tone(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({ score }: { score: number }) {
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(score, 0), 100) / 100);
  return (
    <div className={cn("relative size-20 shrink-0", tone(score))} role="img" aria-label={`Matchning ${score} procent`}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-foreground absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
        {score}%
      </span>
    </div>
  );
}
