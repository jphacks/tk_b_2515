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

		const body = await req.json();
		const { currentPassword, newPassword } = body;

		if (!currentPassword || !newPassword) {
			return NextResponse.json(
				{ error: "現在のパスワードと新しいパスワードを入力してください" },
				{ status: 400 },
			);
		}

		if (newPassword.length < 8) {
			return NextResponse.json(
				{ error: "パスワードは8文字以上で入力してください" },
				{ status: 400 },
			);
		}

		const userId = session.user.id;

		// ユーザーのアカウント情報を取得
		const account = await prisma.account.findFirst({
			where: {
				userId,
				providerId: "credential",
			},
		});

		if (!account || !account.password) {
			return NextResponse.json(
				{ error: "パスワード認証のアカウントが見つかりません" },
				{ status: 404 },
			);
		}

		// Better Authのパスワード検証機能を使用
		// 現在のパスワードが正しいかチェック
		const isValidPassword = await auth.api.signInEmail({
			body: {
				email: session.user.email,
				password: currentPassword,
			},
		});

		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "現在のパスワードが正しくありません" },
				{ status: 400 },
			);
		}

		// Better Authのパスワードハッシュ化を使用
		// 新しいパスワードをハッシュ化して保存
		const bcrypt = await import("bcryptjs");
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		await prisma.account.update({
			where: {
				id: account.id,
			},
			data: {
				password: hashedPassword,
			},
		});

		return NextResponse.json(
			{
				message: "パスワードを変更しました",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Change password error:", error);
		return NextResponse.json(
			{ error: "パスワード変更中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
