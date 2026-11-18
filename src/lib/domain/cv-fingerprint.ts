import { createHash } from "node:crypto";

/**
 * Fingeravtryck av CV-texten – avgör om en matchningsrapport baseras på ett äldre CV.
 * Ren funktion (bara node:crypto) så att både data- och UI-lagret kan använda den.
 */
export function hashCv(cvText: string): string {
  return createHash("sha256").update(cvText.trim()).digest("hex");
}
