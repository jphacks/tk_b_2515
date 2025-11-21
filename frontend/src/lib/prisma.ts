import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// ビルド時のフォールバック用のダミーURL
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		accelerateUrl: databaseUrl,
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
