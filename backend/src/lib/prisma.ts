import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

// PrismaClientのシングルトンインスタンスを作成
// 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
const globalForPrisma = global as unknown as {
	prisma: any;
};

function createPrismaClient() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error(
			"[Prisma] DATABASE_URL is not set. Please configure it in your environment.",
		);
		throw new Error("DATABASE_URL is required");
	}

	// 接続情報をログ出力（機密情報は隠す）
	const host = (() => {
		try {
			return new URL(databaseUrl).host;
		} catch {
			return "(invalid URL)";
		}
	})();
	console.log("[Prisma] Database host:", host);
	console.log("[Prisma] SSL mode:", databaseUrl.includes("sslmode=require"));
	console.log("[Prisma] PgBouncer:", databaseUrl.includes("pgbouncer=true"));
	console.log(
		"[Prisma] Connection limit:",
		databaseUrl.match(/connection_limit=(\d+)/)?.[1] || "not set",
	);

	// Cloudflare Workersなどのエッジ環境ではAccelerateを使用
	// Accelerate URLの場合は prisma:// で始まる
	const isAccelerateUrl = databaseUrl.startsWith("prisma://");

	if (isAccelerateUrl) {
		console.log("[Prisma] Using Prisma Accelerate for edge runtime");
		return new PrismaClient({
			log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
		}).$extends(withAccelerate());
	}

	// 標準のPrisma Clientを使用（ローカル開発用）
	console.log("[Prisma] Using standard Prisma Client");
	return new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
	});
}

// 本番環境では毎回新しいインスタンスを作成（Accelerate使用時）
// 開発環境ではキャッシュを使用
const databaseUrl = process.env.DATABASE_URL || "";
const isAccelerateUrl = databaseUrl.startsWith("prisma://");

export const prisma =
	process.env.NODE_ENV === "production" && isAccelerateUrl
		? createPrismaClient()
		: globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
