/**
 * Prisma Client Singleton
 *
 * This ensures we don't create multiple Prisma Client instances
 * during development (Hot Module Replacement can cause multiple instances)
 *
 * In production: Creates one instance
 * In development: Reuses the same instance across hot reloads
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Fix for Supabase connection pooler - add pgbouncer parameter if not present
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || "";
  if (!url) return url;
  
  // If using Supabase pooler and pgbouncer param not present, add it
  if (url.includes("pooler.supabase.com") && !url.includes("pgbouncer=true")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pgbouncer=true`;
  }
  
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

