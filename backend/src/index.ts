import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { envMiddleware } from "./middleware/env";
import { errorHandler } from "./middleware/error";
import { logger } from "./middleware/logger";
import api from "./routes/api";

const app = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

// グローバルミドルウェア
app.use("/*", envMiddleware);
app.use("/*", errorHandler);
// loggerは開発時のみ有効化（本番環境ではパフォーマンス向上のため無効化）
if (process.env.NODE_ENV !== "production") {
  app.use("/*", logger);
}

// CORS設定: フロントエンドからのリクエストを許可
app.use(
  "/*",
  cors({
    origin: (origin) => {
      // 開発環境のローカルホスト
      if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
        return origin;
      }
      // Vercelのドメイン（すべてのプレビュー環境を含む）
      if (origin?.endsWith(".vercel.app")) {
        return origin;
      }
      // その他の許可されたドメイン
      const allowedOrigins = ["https://renailove.vercel.app"];
      if (origin && allowedOrigins.includes(origin)) {
        return origin;
      }
      return null;
    },
    credentials: true,
  })
);

// ルート
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// APIルート
app.route("/api", api);

// OpenAPI ドキュメントとSwagger UIは開発時のみ有効化（起動速度向上のため）
if (process.env.NODE_ENV !== "production") {
  app.doc("/doc", {
    openapi: "3.1.0",
    info: {
      title: "恋AI API",
      version: "1.0.0",
      description: "AI-powered conversation practice application API",
    },
  });
  app.get("/ui", swaggerUI({ url: "/doc" }));
}

export default app;
