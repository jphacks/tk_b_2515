import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// PrismaClientのシングルトンインスタンスを作成
// 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
const globalForPrisma = global as unknown as {
	prisma: ReturnType<typeof createPrismaClient>;
};

function createPrismaClient() {
	const client = new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});
	return client.$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production")
	globalForPrisma.prisma = prisma;
