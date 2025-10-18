// 環境変数の設定と検証

export const config = {
	// API設定
	api: {
		baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787",
	},

	// TTS設定
	tts: {
		voiceId:
			process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ||
			process.env.ELEVENLABS_VOICE_ID ||
			"",
	},

	// Supabase設定
	supabase: {
		url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
		anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
	},
} as const;

// 環境変数の検証
export function validateConfig() {
	const errors: string[] = [];

	if (!config.supabase.url) {
		errors.push("NEXT_PUBLIC_SUPABASE_URL is not set");
	}

	if (!config.supabase.anonKey) {
		errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
	}

	if (errors.length > 0) {
		console.warn("Missing environment variables:", errors);
	}

	return errors.length === 0;
}
