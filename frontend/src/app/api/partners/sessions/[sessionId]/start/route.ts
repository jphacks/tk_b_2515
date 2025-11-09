import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
	_req: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		if (!sessionId) {
			return NextResponse.json(
				{ error: "sessionId is required" },
				{ status: 400 },
			);
		}

		// Prismaで直接セッションを開始
		await prisma.humanPartnerSession.update({
			where: { id: sessionId },
			data: {
				status: "active",
				startedAt: new Date(),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to start partner session:", error);
		return NextResponse.json(
			{ error: "Failed to start partner session" },
			{ status: 500 },
		);
	}
}
