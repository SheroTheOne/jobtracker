import { cn } from "cn";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS } from "@/lib/domain/application-status";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  SAVED: "bg-muted text-muted-foreground",
  APPLIED: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  INTERVIEW: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  OFFER: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-rose-500/10 text-rose-700/80 dark:text-rose-300/80",
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
