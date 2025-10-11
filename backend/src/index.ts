// biome-ignore assist/source/organizeImports: maintain custom import order
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/error";
import api from "./routes/api";
import swagger from "./routes/swagger";

const app = new Hono();

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

// Swagger/ドキュメント
app.route("/", swagger);

export default app;
