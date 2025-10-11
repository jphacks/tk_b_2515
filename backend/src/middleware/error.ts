import type { Context, Next } from "hono";

export const errorHandler = async (c: Context, next: Next) => {
	try {
		await next();
	} catch (err) {
		console.error("Error:", err);
		return c.json(
			{
				error: "Internal Server Error",
				message: err instanceof Error ? err.message : "Unknown error",
			},
			500,
		);
	}
};
