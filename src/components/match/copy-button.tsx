"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Kopiera" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera – markera texten manuellt.");
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} aria-live="polite">
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Kopierat" : label}
    </Button>
  );
}
