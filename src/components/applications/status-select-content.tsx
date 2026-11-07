import { SelectContent, SelectItem } from "@/components/ui/select";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/domain/application-status";

export function StatusSelectContent() {
  return (
    <SelectContent>
      {APPLICATION_STATUSES.map((status) => (
        <SelectItem key={status} value={status}>
          {STATUS_LABELS[status]}
        </SelectItem>
      ))}
    </SelectContent>
  );
}
