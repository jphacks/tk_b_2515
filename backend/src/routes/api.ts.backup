import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

// Import route modules
import authRoutes from "./modules/auth.routes";
import conversationRoutes from "./modules/conversation.routes";
import feedbackRoutes from "./modules/feedback.routes";
import messagesRoutes from "./modules/messages.routes";
import partnersRoutes from "./modules/partners.routes";
import paymentRoutes from "./modules/payment.routes";
import sessionsRoutes from "./modules/sessions.routes";
import speechRoutes from "./modules/speech.routes";

const api = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

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
api.route("/auth", authRoutes);
api.route("/sessions", sessionsRoutes);
api.route("/sessions", messagesRoutes);
api.route("/sessions", feedbackRoutes);
api.route("/conversation", conversationRoutes);
api.route("/", speechRoutes);
api.route("/partners", partnersRoutes);
api.route("/payment", paymentRoutes);

export default api;
