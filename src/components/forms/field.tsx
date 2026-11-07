import type { ReactNode } from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

interface FieldProps {
  id: string;
  label: string;
  errors?: string[];
  hint?: string;
  className?: string;
  /** Får id, aria-invalid och aria-describedby så att fel kopplas till rätt kontroll. */
  children: (controlProps: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

export function Field({ id, label, errors, hint, className, children }: FieldProps) {
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
