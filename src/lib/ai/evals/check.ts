import type { StoredMatchAnalysis } from "../schemas/match-analysis";
import type { EvalCase } from "./fixtures";

/** Jämför en analys med ett fall i golden set. Returnerar en lista med avvikelser – tom = godkänt. */
export function checkEvalCase(expectations: EvalCase["expect"], analysis: StoredMatchAnalysis, score: number): string[] {
  const failures: string[] = [];
  const matched = analysis.matched.map((m) => m.requirement);
  const missing = analysis.missing.map((m) => m.requirement);

  for (const pattern of expectations.matched) {
    if (!matched.some((r) => new RegExp(pattern, "i").test(r))) failures.push(`saknar matchat krav /${pattern}/`);
  }
  for (const pattern of expectations.missing) {
    if (!missing.some((r) => new RegExp(pattern, "i").test(r))) failures.push(`saknar lucka /${pattern}/`);
  }

  const [min, max] = expectations.score;
  if (score < min || score > max) failures.push(`poäng ${score} utanför ${min}–${max}`);

  if (analysis.matched.length > 0) {
    const ratio = analysis.matched.filter((m) => m.evidenceVerified).length / analysis.matched.length;
    if (ratio < expectations.minVerifiedRatio) {
      failures.push(`verifierade citat ${Math.round(ratio * 100)} % < ${Math.round(expectations.minVerifiedRatio * 100)} %`);
    }
  }
  return failures;
}
