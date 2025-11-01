import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

async function resolveBetterAuthSecret(): Promise<string> {
  if (process.env.BETTER_AUTH_SECRET) {
    console.log("ぼけなすび！");
    return process.env.BETTER_AUTH_SECRET;
  }

  const backendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8787";

  const configUrl = new URL("/auth/config", backendUrl).toString();

  const response = await fetch(configUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Better Auth secret from backend (status ${response.status})`
    );
  }

  const data = (await response.json()) as { secret?: string };
  if (!data.secret) {
    throw new Error("Backend did not return BETTER_AUTH_SECRET");
  }

  return data.secret;
}

const betterAuthSecret = await resolveBetterAuthSecret();

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
});
