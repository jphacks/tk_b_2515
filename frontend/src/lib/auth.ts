import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

function getBetterAuthSecret(): string {
	// ビルド時やランタイムで環境変数を使用
	const secret = process.env.BETTER_AUTH_SECRET;

	// デバッグ用：環境変数の状態をログ出力
	console.log(
		"[Auth] BETTER_AUTH_SECRET status:",
		secret ? "SET" : "NOT SET",
		"| NODE_ENV:",
		process.env.NODE_ENV,
	);

	if (!secret) {
		// ビルド時はダミーのシークレットを使用
		// 本番環境では必ず環境変数を設定すること
		console.warn(
			"[Auth] BETTER_AUTH_SECRET is not set, using fallback for build",
		);
		return "fallback-secret-for-build-only-do-not-use-in-production";
	}

	return secret;
}

const betterAuthSecret = getBetterAuthSecret();

export const auth = betterAuth({
	secret: betterAuthSecret,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	advanced: {
		generateId: () => crypto.randomUUID(),
	},
});
