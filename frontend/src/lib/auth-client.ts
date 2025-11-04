'use client';

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  hooks: {
    after: [
      {
        matcher: ({ path, method }: { path: string; method: string }) =>
          path === "/sign-out" && method === "POST",
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
