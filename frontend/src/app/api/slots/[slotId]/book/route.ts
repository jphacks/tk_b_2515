import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ slotId: string }> },
) {
	try {
		// セッションから認証情報を取得
		const authSession = await auth.api.getSession({
			headers: req.headers,
		});

		if (!authSession?.user) {
			return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
		}

		const userId = authSession.user.id;
		const { slotId } = await params;

		// 枠が存在し、予約可能か確認
		const slot = await prisma.practiceSlot.findUnique({
			where: { id: slotId },
		});

		if (!slot) {
			return NextResponse.json({ error: "Slot not found" }, { status: 404 });
		}

		if (slot.status !== "available") {
			return NextResponse.json(
				{ error: "Slot is not available" },
				{ status: 400 },
			);
		}

		// HumanPartnerSessionを作成
		const session = await prisma.humanPartnerSession.create({
			data: {
				userId,
				partnerId: slot.partnerId,
				status: "waiting",
			},
		});

		// スロットを予約済みに更新
		const updatedSlot = await prisma.practiceSlot.update({
			where: { id: slotId },
			data: {
				status: "booked",
				bookedByUserId: userId,
				bookedAt: new Date(),
				sessionId: session.id,
			},
			include: {
				partner: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			slot: updatedSlot,
			sessionId: session.id,
		});
	} catch (error) {
		console.error("Error booking slot:", error);
		return NextResponse.json({ error: "Failed to book slot" }, { status: 500 });
	}
}
