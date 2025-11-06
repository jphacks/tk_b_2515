import { PrismaClient } from "@prisma/client";

// PrismaClientのシングルトンインスタンスを作成
// 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

function createPrismaClient() {
	// 標準のPrisma Clientを使用（ローカル開発用）
	return new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
	});
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
