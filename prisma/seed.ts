/**
 * Exempeldata för lokal utveckling: `npx prisma db seed`.
 * Körs bara om det inte finns några ansökningar – skriver aldrig över riktig data.
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL saknas");

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY);

async function main(): Promise<void> {
  const existing = await db.jobApplication.count();
  if (existing > 0) {
    console.log(`Hoppar över seed – ${existing} ansökningar finns redan.`);
    return;
  }

  await db.jobApplication.createMany({
    data: [
      {
        company: "Nordlys Tech",
        role: "Fullstackutvecklare (Next.js)",
        url: "https://example.com/jobb/nordlys",
        status: "APPLIED",
        appliedDate: daysAgo(12),
        jobDescriptionText: "Vi söker en fullstackutvecklare med erfarenhet av TypeScript, React och PostgreSQL.",
        notes: "Kontaktperson: rekryterare via LinkedIn.",
      },
      {
        company: "Fjällmark Data",
        role: "Backendutvecklare",
        status: "INTERVIEW",
        appliedDate: daysAgo(20),
        lastContactAt: daysAgo(2),
        notes: "Tekniskt case nästa vecka.",
      },
      {
        company: "Skärgård Systems",
        role: "Frontendutvecklare",
        status: "APPLIED",
        appliedDate: daysAgo(4),
        followUpDate: daysAgo(0),
      },
      { company: "Ekbacken AB", role: "AI-ingenjör", status: "SAVED" },
      { company: "Granit Digital", role: "Senior utvecklare", status: "REJECTED", appliedDate: daysAgo(30) },
    ],
  });
  console.log("Seedade 5 exempelansökningar.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
