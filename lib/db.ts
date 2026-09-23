import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process; hot reload in dev would otherwise open a new pool each save.
const globalForDb = globalThis as unknown as { tripyyyDb?: PrismaClient };

/** The Prisma client, or null when no database is configured (the app then runs local-only). */
export function getDb(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.tripyyyDb) {
    globalForDb.tripyyyDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }
  return globalForDb.tripyyyDb;
}

export function requireDb(): PrismaClient {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  return db;
}
