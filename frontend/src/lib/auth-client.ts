"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
