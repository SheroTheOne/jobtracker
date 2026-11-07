import { BellRing } from "lucide-react";
import { describeFollowUp, type FollowUpState } from "@/lib/domain/follow-up";

export function FollowUpBadge({ state }: { state: FollowUpState }) {
  const label = describeFollowUp(state);
  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-800 dark:text-amber-300">
      <BellRing className="size-3" aria-hidden />
      {label}
    </span>
  );
}
