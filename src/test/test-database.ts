import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Temporär SQLite-databas för integrationstester. Migrationerna i prisma/migrations körs
 * i ordning, så att testerna går mot exakt samma schema som appen – utan att röra dev.db.
 *
 * Måste anropas INNAN något som importerar "@/lib/db/client" laddas (klienten läser
 * DATABASE_URL vid import), därför importeras datalagret dynamiskt i testerna.
 */
export async function setupTestDatabase(): Promise<{ cleanup: () => Promise<void> }> {
  const dir = mkdtempSync(join(tmpdir(), "jobtracker-test-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;

  const { db } = await import("@/lib/db/client");
  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const migrations = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of migrations) {
    const sql = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
    for (const statement of splitStatements(sql)) await db.$executeRawUnsafe(statement);
  }

  return {
    cleanup: async () => {
      await db.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Prismas migrationer har inga triggers eller strängar med semikolon – att dela på ";" räcker. */
function splitStatements(sql: string): string[] {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
