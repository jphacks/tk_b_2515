import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: req.headers });

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { role } = body;

		if (!role || !["user", "partner", "admin"].includes(role)) {
			return NextResponse.json({ error: "Invalid role" }, { status: 400 });
		}

		// ユーザーのroleを更新
		// partnerの場合はisAvailableもtrueに設定
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				role,
				...(role === "partner" && { isAvailable: true }),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update role:", error);
		return NextResponse.json(
			{ error: "Failed to update role" },
			{ status: 500 },
		);
	}
}
