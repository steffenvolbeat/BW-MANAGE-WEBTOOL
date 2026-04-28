import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  adapter: PrismaPg | undefined;
};

const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = globalForPrisma.pool ?? new Pool({
  connectionString: datasourceUrl,
  ssl: datasourceUrl.includes("localhost") || datasourceUrl.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: true }, // equivalent to sslmode=verify-full
});
const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// In production (Vercel Serverless) globalThis caching vermeidet Connection-Pool-Flooding
globalForPrisma.prisma = prisma;
globalForPrisma.pool = pool;
globalForPrisma.adapter = adapter;

export { prisma };
