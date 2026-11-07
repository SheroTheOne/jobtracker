"use client";

import { useTransition } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logContactAction } from "@/lib/actions/applications";

export function LogContactButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick(): void {
    startTransition(async () => {
      const result = await logContactAction(id);
      if (result.ok) toast.success("Kontakt loggad idag");
      else toast.error(result.error);
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MessageSquarePlus aria-hidden />}
      Logga kontakt
    </Button>
  );
}
