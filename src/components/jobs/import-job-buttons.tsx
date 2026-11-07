"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookmarkPlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importJobAction } from "@/lib/actions/jobs";

type Mode = "save" | "match";

export function ImportJobButtons({ adId, canMatch }: { adId: string; canMatch: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);

  function run(mode: Mode): void {
    setActiveMode(mode);
    startTransition(async () => {
      const result = await importJobAction(adId, mode);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.matchError) toast.error(`Sparad, men matchningen misslyckades: ${result.matchError}`);
      else if (result.score !== undefined) toast.success(`Sparad och matchad: ${result.score}%`);
      else toast.success(result.alreadySaved ? "Annonsen var redan sparad" : "Annonsen är sparad");
      router.push(`/applications/${result.applicationId}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => run("save")} disabled={pending}>
        {pending && activeMode === "save" ? <Loader2 className="animate-spin" aria-hidden /> : <BookmarkPlus aria-hidden />}
        Spara
      </Button>
      {canMatch && (
        <Button size="sm" onClick={() => run("match")} disabled={pending}>
          {pending && activeMode === "match" ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {pending && activeMode === "match" ? "Matchar… (~20 s)" : "Spara & matcha"}
        </Button>
      )}
    </div>
  );
}
