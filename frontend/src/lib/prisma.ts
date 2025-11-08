import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not set");
	}

	const client = new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

	if (databaseUrl.startsWith("prisma://")) {
		console.log("[Prisma] Using Prisma Accelerate");
		return client.$extends(withAccelerate());
	}

	console.log("[Prisma] Using standard Prisma Client");
	return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
