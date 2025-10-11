import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/error";
import api from "./routes/api";

const app = new OpenAPIHono<{ Bindings: { ELEVENLABS_API_KEY: string } }>();

// グローバルミドルウェア
app.use("/*", errorHandler);
app.use("/*", logger);

// CORS設定: フロントエンドからのリクエストを許可
app.use(
	"/*",
	cors({
		origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
		credentials: true,
	}),
);

// ルート
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

// APIルート
app.route("/api", api);

// OpenAPI ドキュメント
app.doc("/doc", {
	openapi: "3.1.0",
	info: {
		title: "恋AI API",
		version: "1.0.0",
		description: "AI-powered conversation practice application API",
	},
});

// Swagger UI
app.get("/ui", swaggerUI({ url: "/doc" }));

export default app;
