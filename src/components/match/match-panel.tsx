import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestMatchReport, listMatchReportHistory } from "@/lib/data/match-reports";
import { getProfile } from "@/lib/data/profile";
import { formatDate } from "@/lib/dates";
import { hashCv } from "@/lib/domain/cv-fingerprint";
import { MatchReport } from "./match-report";
import { MatchRunner } from "./match-runner";

interface MatchPanelProps {
  applicationId: string;
  hasJobDescription: boolean;
}

export async function MatchPanel({ applicationId, hasJobDescription }: MatchPanelProps) {
  const [profile, report, history] = await Promise.all([
    getProfile(),
    getLatestMatchReport(applicationId),
    listMatchReportHistory(applicationId),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" aria-hidden />
          AI-matchning
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!profile ? (
          <Hint>
            <Link href="/profile" className="text-primary underline-offset-4 hover:underline">
              Lägg in ditt CV
            </Link>{" "}
            för att kunna matcha annonsen.
          </Hint>
        ) : !hasJobDescription ? (
          <Hint>
            <Link href={`/applications/${applicationId}/edit`} className="text-primary underline-offset-4 hover:underline">
              Klistra in annonstexten
            </Link>{" "}
            för att kunna matcha den mot ditt CV.
          </Hint>
        ) : (
          <MatchRunner applicationId={applicationId} hasReport={report !== null}>
            {report === null ? (
              <Hint>Jämför annonsens krav med ditt CV och få poäng, luckor och ett utkast till pitch.</Hint>
            ) : report.kind === "outdated" ? (
              <Hint>Den senaste analysen ({report.score}%) har ett äldre format. Kör igen för att se detaljerna.</Hint>
            ) : (
              <div className="grid gap-4">
                <MatchReport
                  analysis={report.analysis}
                  score={report.score}
                  model={report.model}
                  createdAt={report.createdAt}
                  cvChanged={report.cvSnapshotHash !== hashCv(profile.cvText)}
                />
                {history.length > 1 && (
                  <p className="text-muted-foreground text-xs">
                    Tidigare körningar:{" "}
                    {history
                      .slice(1)
                      .map((h) => `${h.score}% (${formatDate(h.createdAt)})`)
                      .join(" · ")}
                  </p>
                )}
              </div>
            )}
          </MatchRunner>
        )}
      </CardContent>
    </Card>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
