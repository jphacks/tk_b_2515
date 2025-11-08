import { createRoute, z } from "@hono/zod-openapi";
import { prisma } from "../../lib/prisma";
import { createApiRoute } from "../utils";

const debug = createApiRoute();

// Database connection test endpoint
const dbCheckRoute = createRoute({
	method: "get",
	path: "/__db-check",
	tags: ["Debug"],
	responses: {
		200: {
			description: "Database connection successful",
			content: {
				"application/json": {
					schema: z.object({
						ok: z.boolean(),
						message: z.string(),
						details: z.object({
							isAccelerateUrl: z.boolean(),
							canConnect: z.boolean(),
							version: z.string().optional(),
						}),
					}),
				},
			},
		},
		500: {
			description: "Database connection failed",
			content: {
				"application/json": {
					schema: z.object({
						ok: z.boolean(),
						error: z.string(),
						errorType: z.string(),
						details: z.any(),
					}),
				},
			},
		},
	},
});

debug.openapi(dbCheckRoute, async (c) => {
	try {
		const dbUrl = process.env.DATABASE_URL || "";
		const isAccelerateUrl = dbUrl.startsWith("prisma://");

		console.log("[DB Check] Testing database connection");
		console.log("[DB Check] Using Accelerate:", isAccelerateUrl);

		// 簡単なクエリでデータベース接続をテスト
		const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version() as version
    `;

		const version = result[0]?.version || "unknown";

		return c.json({
			ok: true,
			message: "Database connection successful",
			details: {
				isAccelerateUrl,
				canConnect: true,
				version,
			},
		});
	} catch (error) {
		console.error("[DB Check] Error:", error);

		let errorType = "UNKNOWN";
		if (error instanceof Error) {
			const message = error.message;
			if (message.includes("Accelerate")) {
				errorType = "ACCELERATE_CONFIG_ERROR";
			} else if (message.includes("authentication")) {
				errorType = "DB_AUTH_FAILED";
			} else if (message.includes("SSL") || message.includes("TLS")) {
				errorType = "DB_TLS_REQUIRED";
			} else if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
				errorType = "DB_UNREACHABLE";
			}
		}

		return c.json(
			{
				ok: false,
				error: error instanceof Error ? error.message : "Unknown error",
				errorType,
				details: error,
			},
			500,
		);
	}
});

export default debug;
