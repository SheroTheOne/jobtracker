import { Prisma } from "@/generated/prisma/client";

/** P2025: raden som skulle uppdateras/tas bort finns inte (t.ex. raderad i en annan flik). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

/** P2002: unik-villkor bröts (t.ex. samma annons importerad två gånger samtidigt). */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
