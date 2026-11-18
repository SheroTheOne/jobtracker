/**
 * Användardata (CV, annonser) skickas inom XML-liknande taggar och systemprompten säger
 * att innehållet är data. En annons som själv innehåller "</annons>" skulle kunna bryta sig ut
 * ur taggen och se ut som instruktioner – därför neutraliseras taggar i datan.
 */
export function escapeDataTags(text: string): string {
  return text.replace(/<(\/?)\s*(cv|annons)\s*>/gi, "‹$1$2›");
}

export function wrapData(tag: "cv" | "annons", text: string): string {
  return `<${tag}>\n${escapeDataTags(text)}\n</${tag}>`;
}
