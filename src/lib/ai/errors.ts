import { APICallError, NoObjectGeneratedError, NoOutputGeneratedError, RetryError } from "ai";
import { AiConfigError } from "./config";

export type AiErrorCode =
  | "CONFIG"
  | "RATE_LIMIT"
  | "OVERLOADED"
  | "AUTH"
  | "TIMEOUT"
  | "INVALID_OUTPUT"
  | "NO_REQUIREMENTS"
  | "UNKNOWN";

export interface AiFailure {
  code: AiErrorCode;
  /** Visas för användaren. */
  message: string;
}

const MESSAGES: Record<Exclude<AiErrorCode, "CONFIG">, string> = {
  RATE_LIMIT: "Gratiskvoten hos AI-tjänsten är slut för stunden. Vänta en minut och försök igen.",
  OVERLOADED: "AI-tjänsten är överbelastad just nu. Försök igen om en stund.",
  AUTH: "API-nyckeln avvisades. Kontrollera GOOGLE_GENERATIVE_AI_API_KEY i .env.",
  TIMEOUT: "Analysen tog för lång tid och avbröts. Försök igen.",
  INVALID_OUTPUT: "AI:n returnerade ett svar som inte följde formatet. Försök igen.",
  NO_REQUIREMENTS: "AI:n hittade inga krav i annonsen. Kontrollera att hela annonstexten är inklistrad.",
  UNKNOWN: "Analysen misslyckades av okänd anledning. Försök igen.",
};

export function aiFailure(code: Exclude<AiErrorCode, "CONFIG">): AiFailure {
  return { code, message: MESSAGES[code] };
}

function fromApiCallError(error: APICallError): Exclude<AiErrorCode, "CONFIG"> {
  const status = error.statusCode;
  if (status === 429) return "RATE_LIMIT";
  if (status === 401 || status === 403) return "AUTH";
  // Google svarar 400 både för ogiltig nyckel och ogiltig förfrågan – skilj på dem via svaret.
  if (status === 400 && /api[_ ]key/i.test(`${error.message} ${error.responseBody ?? ""}`)) return "AUTH";
  if (status !== undefined && status >= 500) return "OVERLOADED";
  return "UNKNOWN";
}

/**
 * Svaret följde inte schemat (NoObjectGeneratedError) eller saknades helt, t.ex. för att
 * det trunkerades eller stoppades av innehållsfilter (NoOutputGeneratedError).
 */
export function isInvalidOutputError(error: unknown): boolean {
  return NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error);
}

/** Översätter tekniska fel från AI SDK till en felkod och ett begripligt meddelande. */
export function classifyAiError(error: unknown): AiFailure {
  if (error instanceof AiConfigError) return { code: "CONFIG", message: error.message };

  // Efter uttömda omförsök ligger det egentliga felet i lastError.
  const cause = RetryError.isInstance(error) ? error.lastError : error;

  let code: Exclude<AiErrorCode, "CONFIG">;
  if (APICallError.isInstance(cause)) code = fromApiCallError(cause);
  else if (isInvalidOutputError(cause)) code = "INVALID_OUTPUT";
  else if (cause instanceof DOMException && (cause.name === "TimeoutError" || cause.name === "AbortError")) code = "TIMEOUT";
  else code = "UNKNOWN";

  return aiFailure(code);
}
