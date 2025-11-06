import { OpenAPIHono } from "@hono/zod-openapi";

export type ApiBindings = {
	Bindings: {
		ELEVENLABS_API_KEY: string;
		GEMINI_API_KEY: string;
	};
};

/**
 * Creates an OpenAPI-aware Hono router with shared bindings and error handling.
 */
export function createApiRoute(): OpenAPIHono<ApiBindings> {
	const route = new OpenAPIHono<ApiBindings>();

	route.onError((err, c) => {
		console.error("Unhandled route error:", err);
		return c.json({ error: "Internal server error" }, 500);
	});

	return route;
}
