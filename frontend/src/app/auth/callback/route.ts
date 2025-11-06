import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");

	if (code) {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseAnonKey) {
			console.error("Supabase credentials are not configured.");
			return NextResponse.redirect(
				new URL("/login?error=configuration", requestUrl.origin),
			);
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey);

		await supabase.auth.exchangeCodeForSession(code);
	}

	// ログイン成功後、ホームページにリダイレクト
	return NextResponse.redirect(new URL("/", requestUrl.origin));
}
