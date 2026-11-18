import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, CircleDashed, CircleHelp, Lightbulb, TriangleAlert } from "lucide-react";
import type { TokenUsage } from "@/lib/ai/generate-structured";
import type { StoredMatchAnalysis } from "@/lib/ai/schemas/match-analysis";
import { IMPORTANCE_LABELS, type Importance } from "@/lib/domain/requirements";
import { formatDate } from "@/lib/dates";
import { CopyButton } from "./copy-button";
import { ScoreRing } from "./score-ring";

interface MatchReportProps {
  analysis: StoredMatchAnalysis;
  score: number;
  model: string;
  promptVersion: string;
  usage: TokenUsage;
  createdAt: Date;
  cvChanged: boolean;
}

function formatUsage({ inputTokens, outputTokens }: TokenUsage): string | null {
  if (inputTokens === null && outputTokens === null) return null;
  const total = (inputTokens ?? 0) + (outputTokens ?? 0);
  return `${total.toLocaleString("sv-SE")} tokens`;
}

export function MatchReport({ analysis, score, model, promptVersion, usage, createdAt, cvChanged }: MatchReportProps) {
  const usageLabel = formatUsage(usage);
  const critical = analysis.missing.filter((m) => m.importance === "CRITICAL");
  const niceToHave = analysis.missing.filter((m) => m.importance === "NICE_TO_HAVE");
  const unverified = analysis.matched.filter((m) => !m.evidenceVerified).length;

  return (
    <div className="grid gap-6">
      {cvChanged && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          Ditt CV har ändrats sedan analysen. Kör igen för en aktuell bedömning.
        </p>
      )}

      <div className="flex items-start gap-4">
        <ScoreRing score={score} />
        <div className="grid gap-1">
          <p className="text-sm">{analysis.assessment}</p>
          <p className="text-muted-foreground text-xs">
            {analysis.matched.length} uppfyllda · {critical.length} saknade krav · {niceToHave.length} saknade meriter
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Matchade krav" icon={<CircleCheck className="size-4 text-emerald-600" aria-hidden />}>
          {analysis.matched.length === 0 ? (
            <Empty>Inga krav kunde styrkas med CV:t.</Empty>
          ) : (
            <ul className="grid gap-3">
              {analysis.matched.map((match, index) => (
                <li key={`${index}-${match.requirement}`} className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    {match.strength === "STRONG" ? (
                      <CircleCheck className="size-3.5 shrink-0 text-emerald-600" aria-label="Starkt" />
                    ) : (
                      <CircleDashed className="size-3.5 shrink-0 text-amber-600" aria-label="Delvis" />
                    )}
                    {match.requirement}
                    <ImportanceTag importance={match.importance} />
                  </div>
                  <blockquote className="border-muted text-muted-foreground border-l-2 pl-2 text-xs italic">
                    ”{match.evidence}”
                  </blockquote>
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    {match.cvSection}
                    {!match.evidenceVerified && (
                      <span
                        className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400"
                        title="Citatet hittades inte ordagrant i CV:t – räknas högst som delvis uppfyllt."
                      >
                        <CircleHelp className="size-3" aria-hidden /> ej verifierat
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Saknas" icon={<CircleAlert className="size-4 text-rose-600" aria-hidden />}>
          {analysis.missing.length === 0 ? (
            <Empty>Inga luckor hittades.</Empty>
          ) : (
            <div className="grid gap-4">
              <GapList title="Kritiska" items={critical} />
              <GapList title="Meriterande" items={niceToHave} />
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ChipGroup title="Tech-stack" items={analysis.techStack} />
        <ChipGroup title="Nyckelord" items={analysis.keywords} />
      </div>

      <Section title="Pitch" icon={<Lightbulb className="size-4 text-amber-500" aria-hidden />}>
        <div className="grid gap-4">
          <div className="bg-muted/40 grid gap-2 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-muted-foreground text-xs font-medium">Till personligt brev</h4>
              <CopyButton text={analysis.pitch.coverLetterParagraph} />
            </div>
            <p className="text-sm whitespace-pre-wrap">{analysis.pitch.coverLetterParagraph}</p>
          </div>
          <div className="grid gap-1">
            <h4 className="text-muted-foreground text-xs font-medium">Att lyfta i intervju</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {analysis.pitch.talkingPoints.map((point, index) => (
                <li key={`${index}-${point}`}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <footer className="text-muted-foreground border-t pt-3 text-xs">
        Analyserad {formatDate(createdAt)} · {model} · prompt {promptVersion}
        {usageLabel && ` · ${usageLabel}`}
        {unverified > 0 && ` · ${unverified} belägg kunde inte verifieras`}
        <details className="mt-1">
          <summary className="cursor-pointer">Hur räknas poängen?</summary>
          <p className="mt-1">
            Poängen räknas i kod, inte av AI:n: varje krav väger 3 (krav) eller 1 (meriterande). Starkt uppfyllt ger full
            vikt, delvis eller overifierat ger halv. Poäng = uppnådd vikt / total vikt.
          </p>
        </details>
      </footer>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="grid content-start gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

function ImportanceTag({ importance }: { importance: Importance }) {
  return (
    <span className="bg-muted text-muted-foreground rounded px-1.5 py-px text-[10px] font-normal tracking-wide uppercase">
      {IMPORTANCE_LABELS[importance]}
    </span>
  );
}

function GapList({ title, items }: { title: string; items: StoredMatchAnalysis["missing"] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-2">
      <h4 className="text-muted-foreground text-xs font-medium">{title}</h4>
      <ul className="grid gap-2">
        {items.map((gap, index) => (
          <li key={`${index}-${gap.requirement}`} className="grid gap-0.5">
            <span className="text-sm font-medium">{gap.requirement}</span>
            <span className="text-muted-foreground text-xs">{gap.suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid content-start gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="bg-muted rounded-md px-2 py-0.5 text-xs">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
