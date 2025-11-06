import { createRoute, z } from "@hono/zod-openapi";
// Import route modules
import authRoutes from "./modules/auth.routes";
import conversationRoutes from "./modules/conversation.routes";
import feedbackRoutes from "./modules/feedback.routes";
import messagesRoutes from "./modules/messages.routes";
import partnersRoutes from "./modules/partners.routes";
import paymentRoutes from "./modules/payment.routes";
import sessionsRoutes from "./modules/sessions.routes";
import speechRoutes from "./modules/speech.routes";
import { createApiRoute } from "./utils";

const api = createApiRoute();

// Health check endpoint with OpenAPI
const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	responses: {
		200: {
			description: "API is healthy",
			content: {
				"application/json": {
					schema: z.object({
						status: z.string().openapi({ example: "ok" }),
					}),
				},
			},
		},
	},
});

api.openapi(healthRoute, (c) => {
	return c.json({ status: "ok" });
});

// Mount route modules
[
	{ basePath: "/auth", router: authRoutes },
	{ basePath: "/sessions", router: sessionsRoutes },
	{ basePath: "/sessions", router: messagesRoutes },
	{ basePath: "/sessions", router: feedbackRoutes },
	{ basePath: "/conversation", router: conversationRoutes },
	{ basePath: "/", router: speechRoutes },
	{ basePath: "/partners", router: partnersRoutes },
	{ basePath: "/payment", router: paymentRoutes },
].forEach(({ basePath, router }) => {
	api.route(basePath, router);
});

export default api;
