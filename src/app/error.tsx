"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
      <TriangleAlert className="text-destructive size-8" aria-hidden />
      <h1 className="text-lg font-semibold">Något gick fel</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Sidan kunde inte laddas. Försök igen – kvarstår felet, kontrollera att databasen är igång.
      </p>
      <Button variant="outline" onClick={retry}>
        Försök igen
      </Button>
    </div>
  );
}
