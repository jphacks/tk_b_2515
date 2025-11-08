"use client";

import { createAuthClient } from "better-auth/react";

// 本番で NEXT_PUBLIC_APP_URL が未設定でも落ちないように、ブラウザでは location.origin をフォールバック
const resolveBaseUrl = (): string => {
	const envUrl = process.env.NEXT_PUBLIC_APP_URL;
	if (envUrl && envUrl.length > 0) return envUrl;
	if (typeof window !== "undefined" && window.location?.origin) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"[auth-client] NEXT_PUBLIC_APP_URL is not set. Falling back to window.location.origin:",
				window.location.origin,
			);
		}
		return window.location.origin;
	}
	// 最後のフォールバック（ビルド時など）。実行時には上書きされる想定
	return "";
};

export const authClient = createAuthClient({
	baseURL: resolveBaseUrl(),
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
