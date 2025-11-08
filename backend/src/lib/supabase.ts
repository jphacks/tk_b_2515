import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// バックエンドではNEXT_PUBLIC_プレフィックスなしの環境変数も使用可能
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数が無い場合でもアプリ全体が落ちないよう、null を返す
let client: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
	client = createClient(supabaseUrl, supabaseAnonKey);
} else {
	// 本番環境で匿名サインインが不要な場合に備え、警告ログのみに留める
	console.warn("[Supabase] Missing SUPABASE_URL/ANON_KEY. Anonymous auth will be skipped.");
}

export const supabase = client;
