import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth"; // 開発中は一時的にコメントアウト

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// 開発中: 認証を一時的に無効化
	console.log(
		"[Middleware] Development mode - authentication disabled for:",
		pathname,
	);
	return NextResponse.next();

	// ログインページは除外
	// if (pathname === "/partner/login" || pathname === "/admin/login") {
	//   return NextResponse.next();
	// }

	// // パートナーページと管理者ページへのアクセス制御
	// if (pathname.startsWith("/partner") || pathname.startsWith("/admin")) {
	//   try {
	//     // Better Authのセッション情報を取得
	//     const session = await auth.api.getSession({
	//       headers: req.headers,
	//     });

	//     // セッションが存在しない、またはユーザー情報が取得できない場合
	//     if (!session?.user) {
	//       const url = req.nextUrl.clone();
	//       // アクセスしているパスに応じてログインページを選択
	//       url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/partner/login";
	//       url.searchParams.set("redirect", pathname);
	//       return NextResponse.redirect(url);
	//     }

	//     // ユーザーのロールを確認
	//     const userRole = (session.user as { role?: string }).role;

	//     // デバッグログ
	//     console.log('[Middleware] User:', session.user.email, 'Role:', userRole, 'Path:', pathname);

	//     // 管理者は全てのページにアクセス可能
	//     if (userRole === "admin") {
	//       console.log('[Middleware] Admin access granted');
	//       return NextResponse.next();
	//     }

	//     // 管理者ページは管理者のみアクセス可能（上記で既にチェック済み）
	//     if (pathname.startsWith("/admin")) {
	//       const url = req.nextUrl.clone();
	//       url.pathname = "/";
	//       return NextResponse.redirect(url);
	//     }

	//     // パートナーページはパートナーのみアクセス可能
	//     if (pathname.startsWith("/partner") && userRole !== "partner") {
	//       const url = req.nextUrl.clone();
	//       url.pathname = "/";
	//       return NextResponse.redirect(url);
	//     }

	//     // 権限がある場合、アクセスを許可
	//     return NextResponse.next();
	//   } catch (error) {
	//     console.error("Middleware authentication error:", error);
	//     // エラーが発生した場合、適切なログインページにリダイレクト
	//     const url = req.nextUrl.clone();
	//     url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/partner/login";
	//     return NextResponse.redirect(url);
	//   }
	// }

	// return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
	matcher: [
		"/partner/:path*", // パートナー専用ページ全体
		"/admin/:path*", // 管理者専用ページ全体
	],
};
