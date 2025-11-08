import { PrismaClient } from "../generated/prisma";
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
		return new PrismaClient({
			datasourceUrl: databaseUrl,
			log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
		}).$extends(withAccelerate()) as unknown as PrismaClient;
	}

	// 標準のPrisma Clientを使用（ローカル開発用）
	console.log("[Prisma] Using standard Prisma Client");
	if (process.env.NODE_ENV === "production") {
		// Cloudflare Workers の本番で直接 Postgres 接続はできません。Accelerate の利用を促す警告を出します。
		if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
			console.warn(
				"[Prisma] In production on Workers, use Prisma Accelerate. Set DATABASE_URL to your prisma:// connection string."
			);
		}
	}
	return new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
	});
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
