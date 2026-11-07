"use client";

import { useOptimistic, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { changeStatusAction } from "@/lib/actions/applications";
import { STATUS_LABELS, isApplicationStatus } from "@/lib/domain/application-status";
import { StatusSelectContent } from "./status-select-content";

export function StatusQuickSelect({ id, status }: { id: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  function handleChange(next: unknown): void {
    if (!isApplicationStatus(next) || next === optimisticStatus) return;
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await changeStatusAction(id, next);
      if (result.ok) toast.success(`Status ändrad till ${STATUS_LABELS[next]}`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={optimisticStatus} onValueChange={handleChange} items={STATUS_LABELS} disabled={pending}>
        <SelectTrigger aria-label="Ändra status" className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <StatusSelectContent />
      </Select>
      {pending && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label="Sparar" />}
    </div>
  );
}
