import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		// 認証チェック
		const session = await auth.api.getSession({
			headers: req.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const userRole = (session.user as { role?: string }).role;
		if (userRole !== "admin") {
			return NextResponse.json(
				{ error: "管理者権限が必要です" },
				{ status: 403 },
			);
		}

		const body = await req.json();
		const { email, name, password } = body;

		if (!email || !name || !password) {
			return NextResponse.json(
				{ error: "全ての項目を入力してください" },
				{ status: 400 },
			);
		}

		// メールアドレスの重複チェック
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "このメールアドレスは既に使用されています" },
				{ status: 400 },
			);
		}

		// Better Authのsignup APIを使用してパートナーを作成
		const signUpResponse = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
			},
		});

		if (!signUpResponse) {
			return NextResponse.json(
				{ error: "ユーザーの作成に失敗しました" },
				{ status: 500 },
			);
		}

		// ユーザーのロールをpartnerに変更
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "作成されたユーザーが見つかりません" },
				{ status: 500 },
			);
		}

		await prisma.user.update({
			where: { id: user.id },
			data: {
				role: "partner",
				emailVerified: true, // 管理者が招待したので自動的に検証済みにする
			},
		});

		return NextResponse.json(
			{
				message: "パートナーを招待しました",
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Invite partner error:", error);
		return NextResponse.json(
			{ error: "招待処理中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
