import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId, partnerId } = body;

		if (!userId || !partnerId) {
			return NextResponse.json(
				{ error: "userId and partnerId are required" },
				{ status: 400 },
			);
		}

		// 一意なroom IDを生成
		const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;

		// Prismaで直接セッションを作成
		const session = await prisma.humanPartnerSession.create({
			data: {
				userId,
				partnerId,
				status: "waiting",
				roomId,
			},
		});

		return NextResponse.json({
			sessionId: session.id,
			roomId: session.roomId || roomId,
		});
	} catch (error) {
		console.error("Failed to create partner session:", error);
		return NextResponse.json(
			{ error: "Failed to create partner session" },
			{ status: 500 },
		);
	}
}
