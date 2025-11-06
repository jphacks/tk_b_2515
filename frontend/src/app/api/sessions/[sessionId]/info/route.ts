import { PrismaClient } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await prisma.humanPartnerSession.findUnique({
			where: { id: sessionId },
			select: {
				id: true,
				userId: true,
				partnerId: true,
				status: true,
				startedAt: true,
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		return NextResponse.json(session);
	} catch (error) {
		console.error("Error fetching session info:", error);
		return NextResponse.json(
			{ error: "Failed to fetch session info" },
			{ status: 500 },
		);
	}
}
