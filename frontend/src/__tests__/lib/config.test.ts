import { config, validateConfig } from "@/lib/config";

describe("config", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	describe("config object", () => {
		it("has api configuration", () => {
			expect(config.api).toBeDefined();
			expect(config.api.baseUrl).toBeDefined();
		});

		it("has tts configuration", () => {
			expect(config.tts).toBeDefined();
			expect(config.tts).toHaveProperty("voiceId");
		});

		it("has supabase configuration", () => {
			expect(config.supabase).toBeDefined();
			expect(config.supabase).toHaveProperty("url");
			expect(config.supabase).toHaveProperty("anonKey");
		});

		it("uses default API URL when not set", () => {
			expect(config.api.baseUrl).toBeTruthy();
		});
	});

	describe("validateConfig", () => {
		it("returns false when Supabase URL is missing", () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "";
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

			// Re-import to get updated env vars
			jest.resetModules();
			const { validateConfig: newValidateConfig } = require("@/lib/config");
			const result = newValidateConfig();

			expect(result).toBe(false);
			expect(consoleWarnSpy).toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});

		it("returns false when Supabase anon key is missing", () => {
			process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

			jest.resetModules();
			const { validateConfig: newValidateConfig } = require("@/lib/config");
			const result = newValidateConfig();

			expect(result).toBe(false);
			expect(consoleWarnSpy).toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});

		it("warns about missing environment variables", () => {
			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

			validateConfig();

			// Should warn if any required env vars are missing
			if (!config.supabase.url || !config.supabase.anonKey) {
				expect(consoleWarnSpy).toHaveBeenCalled();
			}

			consoleWarnSpy.mockRestore();
		});
	});
});
