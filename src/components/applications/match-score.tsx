import { cn } from "cn";

function scoreTone(score: number): string {
  if (score >= 75) return "text-emerald-700 dark:text-emerald-300";
  if (score >= 50) return "text-amber-700 dark:text-amber-300";
  return "text-rose-700 dark:text-rose-300";
}

export function MatchScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">–</span>;
  return <span className={cn("font-medium tabular-nums", scoreTone(score))}>{score}%</span>;
}
