/**
 * Regressionstest av AI-matchningen mot golden set (src/lib/ai/evals/fixtures.ts).
 *
 *   npm run eval:match
 *
 * Gör riktiga AI-anrop när AI_PROVIDER="google" – kostar kvot. I testläge (mock) körs bara
 * flödet igenom, och förväntningarna kontrolleras inte.
 */
import "dotenv/config";
import { analyzeMatch } from "@/lib/ai/analyze-match";
import { checkEvalCase } from "@/lib/ai/evals/check";
import { EVAL_CASES } from "@/lib/ai/evals/fixtures";

async function main(): Promise<void> {
  const live = process.env.AI_PROVIDER === "google";
  if (!live) console.warn('AI_PROVIDER är inte "google" – kör i testläge, förväntningarna kontrolleras inte.\n');

  let failed = 0;
  for (const evalCase of EVAL_CASES) {
    const started = Date.now();
    const result = await analyzeMatch(evalCase.input);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    if (!result.ok) {
      failed++;
      console.log(`✗ ${evalCase.name} (${seconds} s)\n    AI-fel: ${result.error.code} – ${result.error.message}`);
      continue;
    }

    const { analysis, score, model } = result.value;
    const failures = live ? checkEvalCase(evalCase.expect, analysis, score) : [];
    const verified = analysis.matched.filter((m) => m.evidenceVerified).length;
    console.log(
      `${failures.length === 0 ? "✓" : "✗"} ${evalCase.name} (${seconds} s)\n` +
        `    ${score} % · ${analysis.matched.length} matchade (${verified} verifierade) · ${analysis.missing.length} saknade · ${model}`,
    );
    for (const failure of failures) console.log(`    – ${failure}`);
    if (failures.length > 0) failed++;
  }

  console.log(`\n${EVAL_CASES.length - failed}/${EVAL_CASES.length} fall godkända.`);
  if (failed > 0) process.exitCode = 1;
}

void main();
