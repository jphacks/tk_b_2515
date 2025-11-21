import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// PrismaClientのシングルトンインスタンスを作成
// 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

function createPrismaClient() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error(
			"[Prisma] DATABASE_URL is not set. Please configure it in your environment.",
		);
		throw new Error("DATABASE_URL is required");
	}

	// Cloudflare Workersなどのエッジ環境ではAccelerateを使用
	// Accelerate URLの場合は prisma:// で始まる
	const isAccelerateUrl = databaseUrl.startsWith("prisma://");

	if (isAccelerateUrl) {
		console.log("[Prisma] Using Prisma Accelerate for edge runtime");
		// Prisma 7では accelerateUrl を明示的に指定する
		const client = new PrismaClient({
			accelerateUrl: databaseUrl,
			log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
		});
		return client.$extends(withAccelerate()) as unknown as PrismaClient;
	}

	// 標準のPrisma Clientを使用（ローカル開発用）
	// Prisma 7では直接接続の場合も accelerateUrl を指定
	console.log("[Prisma] Using standard Prisma Client");
	return new PrismaClient({
		accelerateUrl: databaseUrl,
		log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
	});
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
