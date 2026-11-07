/**
 * Plockar ut annons-id ur en Platsbanken-länk.
 * Stöder t.ex. https://arbetsformedlingen.se/platsbanken/annonser/31697074 (med eller utan query/hash),
 * samt ett naket id.
 */
export function parsePlatsbankenAdId(input: string): string | null {
  const value = input.trim();
  if (/^\d{5,15}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/(^|\.)arbetsformedlingen\.se$/.test(url.hostname)) return null;
  const match = url.pathname.match(/\/platsbanken\/annonser\/(\d{5,15})(?:\/|$)/);
  return match?.[1] ?? null;
}
