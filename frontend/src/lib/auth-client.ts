"use client";

import { createAuthClient } from "better-auth/react";

// ブラウザ環境でのbaseURLを取得
function getBaseURL(): string {
	// 環境変数が設定されている場合はそれを使用
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}

	// ブラウザ環境の場合、現在のオリジンを使用
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	// サーバー環境またはビルド時のフォールバック
	return "http://localhost:3000";
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	hooks: {
		after: [
			{
				matcher: (req: { path: string; method: string }) =>
					req.path === "/sign-out" && req.method === "POST",
				handler: async () => {
					try {
						await fetch("/api/auth/signout", { method: "POST" });
					} catch (error) {
						console.error("Failed to sign out from backend:", error);
					}
				},
			},
		],
	},
});

export const { signIn, signUp, signOut, useSession } = authClient;
