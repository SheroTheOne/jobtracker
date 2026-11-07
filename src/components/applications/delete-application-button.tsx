"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteApplicationAction } from "@/lib/actions/applications";

interface DeleteApplicationButtonProps {
  id: string;
  label: string;
}

export function DeleteApplicationButton({ id, label }: DeleteApplicationButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete(): void {
    startTransition(async () => {
      // Vid lyckad borttagning omdirigerar actionen och returnerar aldrig.
      const result = await deleteApplicationAction(id);
      if (!result.ok) {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger render={<Button variant="ghost" className="text-destructive hover:text-destructive" />}>
        <Trash2 aria-hidden />
        Ta bort
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort ansökan?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} och alla tillhörande matchningsrapporter tas bort permanent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Avbryt</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Ta bort
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
