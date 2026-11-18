import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * SQLite-inställningar:
 * - busy_timeout: väntar upp till 5 s på lås i stället för att direkt ge SQLITE_BUSY
 *   (better-sqlite3:s standard, satt explicit här för tydlighet).
 * - foreign_keys: alltid på i better-sqlite3 – krävs för onDelete: Cascade på MatchReport.
 * - journal_mode=WAL: läsare blockerar inte skrivare och tvärtom, t.ex. när Prisma Studio,
 *   seed-skriptet eller ett bygge läser samtidigt som appen skriver. Lagras i databasfilen,
 *   så det räcker att sätta det en gång – men det är billigt och idempotent att göra vid start.
 */
const BUSY_TIMEOUT_MS = 5_000;

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL saknas i miljön");
  const adapter = new PrismaBetterSqlite3({ url, timeout: BUSY_TIMEOUT_MS });
  const client = new PrismaClient({ adapter });

  if (url !== ":memory:") {
    // PRAGMA journal_mode returnerar en rad, därför queryRaw. Misslyckas det (t.ex. för att en annan
    // process håller ett lås under bygget) fungerar appen ändå – bara utan WAL tills nästa start.
    client.$queryRawUnsafe("PRAGMA journal_mode = WAL").catch((error: unknown) => {
      console.warn("[db] kunde inte aktivera WAL", error);
    });
  }
  return client;
}

// Återanvänd en instans över HMR-omladdningar i dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
