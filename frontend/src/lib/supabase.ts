import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// 環境変数が設定されていない場合は警告を出す（ビルド時は許容）
if (
	typeof window !== "undefined" &&
	(process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === undefined)
) {
	console.warn(
		"Supabase client is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
