/**
 * Verifierar att modellens citat ("belägg") faktiskt står i CV:t – vårt skydd mot hallucinerade belägg.
 *
 * Toleransen är avvägd: formatering får skilja (skiftläge, blanksteg, citattecken, streck,
 * punktuation, markdown, PDF-ligaturer), men orden måste finnas ordagrant och som hela ord.
 */

/** Kortare delcitat än så här bevisar ingenting ("i", "en"). */
const MIN_PART_LENGTH = 2;

/** Normaliserar till en sekvens av ord separerade med enkla blanksteg. */
export function normalizeForEvidence(text: string): string {
  return (
    text
      // NFKC: ligaturer från PDF (ﬁ → fi), helbreddstecken och sammansatta å/ä/ö (NFD → NFC).
      .normalize("NFKC")
      .replace(/­/g, "") // mjukt bindestreck
      .toLocaleLowerCase("sv-SE")
      .replace(/[‘’´`]/g, "'")
      .replace(/[“”„«»]/g, '"')
      .replace(/[‐‑‒–—−]/g, "-")
      // . ' - räknas som del av ord bara när de står mellan bokstäver/siffror (Node.js, CI-miljö, 2022-2025).
      .replace(/(?<![\p{L}\p{N}])[.'-]|[.'-](?![\p{L}\p{N}])/gu, " ")
      // Allt annat utom bokstäver, siffror och + # (C++, C#) blir ordgräns – även markdown (**, [], #-rubriker).
      .replace(/(?<![\p{L}\p{N}+])#|[^\p{L}\p{N}\s.'+#-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Delar ett citat på ellips – modellen får korta ned långa citat med "…" eller "...". */
function splitQuote(evidence: string): string[] {
  return evidence
    .split(/\.{3,}|…|\[\s*\.\.\.\s*\]/)
    .map(normalizeForEvidence)
    .filter((part) => part.length > 0);
}

/**
 * Skapar en verifierare för ett CV. CV:t normaliseras en gång, så att många citat kan
 * kontrolleras billigt.
 */
export function createEvidenceVerifier(cvText: string): (evidence: string) => boolean {
  // Blanksteg runt om så att varje träff kan kräva ordgräns i båda ändar.
  const haystack = ` ${normalizeForEvidence(cvText)} `;

  return (evidence) => {
    const parts = splitQuote(evidence);
    if (parts.length === 0) return false;

    // Delarna ska finnas som hela ord och i samma ordning som i citatet.
    let cursor = 0;
    for (const part of parts) {
      if (part.length < MIN_PART_LENGTH) return false;
      const index = haystack.indexOf(` ${part} `, cursor);
      if (index === -1) return false;
      cursor = index + part.length + 1;
    }
    return true;
  };
}

export function isEvidenceInCv(cvText: string, evidence: string): boolean {
  return createEvidenceVerifier(cvText)(evidence);
}
