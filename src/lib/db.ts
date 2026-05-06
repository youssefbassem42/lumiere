import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  if (!connectionString && process.env.NODE_ENV === "production") {
    console.warn("DATABASE_URL is not set. Prisma client might fail.");
  }

  const options: any = {
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  };

  if (connectionString) {
    options.adapter = new PrismaPg({ connectionString });
  }

  return new PrismaClient(options);
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
