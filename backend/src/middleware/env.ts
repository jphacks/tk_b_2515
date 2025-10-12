import type { MiddlewareHandler } from "hono";

/**
 * Node.js環境でprocess.envをc.envにマッピングするミドルウェア
 * Cloudflare Workers環境では既にc.envが設定されているため、上書きしない
 */
export const envMiddleware: MiddlewareHandler = async (c, next) => {
	// Cloudflare Workers環境では既にc.envが存在するのでスキップ
	if (!c.env || Object.keys(c.env).length === 0) {
		// Node.js環境: process.envからc.envに必要な環境変数をマッピング
		c.env = {
			GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
			ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || "",
		};
	}

	await next();
};
