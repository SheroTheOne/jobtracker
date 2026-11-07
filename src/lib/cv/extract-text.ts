import "server-only";

/**
 * Plockar ut text ur ett uppladdat CV. Sker lokalt på servern – inget skickas vidare.
 * Stöd: PDF (unpdf), Word .docx (mammoth), Markdown och ren text.
 */

export const CV_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const CV_UPLOAD_ACCEPT = ".pdf,.docx,.md,.markdown,.txt";

const MIN_TEXT_LENGTH = 50;

type FileKind = "pdf" | "docx" | "text";

function detectKind(file: File): FileKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  if (/\.(md|markdown|txt)$/.test(name) || file.type.startsWith("text/")) return "text";
  return null;
}

/** Städar extraherad text: enhetliga radbrytningar, inga avslutande blanksteg, max en tom rad i följd. */
export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function readDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

export type ExtractResult = { ok: true; text: string } | { ok: false; error: string };

export async function extractCvText(file: File): Promise<ExtractResult> {
  if (file.size === 0) return { ok: false, error: "Filen är tom." };
  if (file.size > CV_UPLOAD_MAX_BYTES) return { ok: false, error: "Filen är för stor (max 5 MB)." };

  const kind = detectKind(file);
  if (!kind) {
    const hint = file.name.toLowerCase().endsWith(".doc") ? " Spara om den som .docx eller PDF." : "";
    return { ok: false, error: `Filtypen stöds inte. Använd PDF, Word (.docx), Markdown eller text.${hint}` };
  }

  let raw: string;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    raw = kind === "pdf" ? await readPdf(bytes) : kind === "docx" ? await readDocx(bytes) : new TextDecoder("utf-8").decode(bytes);
  } catch (error) {
    console.error("[cv/extract-text]", kind, error);
    return { ok: false, error: "Filen kunde inte läsas. Är den skadad eller lösenordsskyddad?" };
  }

  const text = normalizeExtractedText(raw);
  if (text.length < MIN_TEXT_LENGTH) {
    return {
      ok: false,
      error:
        kind === "pdf"
          ? "Ingen text hittades i PDF:en – den är troligen inskannad som bild. Exportera CV:t som text-PDF eller Word."
          : "Filen innehåller för lite text.",
    };
  }
  return { ok: true, text };
}
