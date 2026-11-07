"use server";

import { extractDocumentText } from "@/lib/documents/extract-text";

export type ExtractDocumentResult = { ok: true; fileName: string; text: string } | { ok: false; error: string };

/** Läser text ur en uppladdad fil (t.ex. en annons som PDF). Sparar inget och anropar ingen AI. */
export async function extractDocumentAction(formData: FormData): Promise<ExtractDocumentResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Ingen fil valdes." };
  const result = await extractDocumentText(file);
  return result.ok ? { ok: true, fileName: file.name, text: result.text } : result;
}
