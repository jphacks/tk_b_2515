import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: req.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const partnerId = session.user.id;
		const isPartner = (session.user as { role?: string }).role === "partner";

		if (!isPartner) {
			return NextResponse.json(
				{ error: "Partner role required" },
				{ status: 403 },
			);
		}

		const waitingSessions = await prisma.humanPartnerSession.findMany({
			where: {
				partnerId,
				status: "waiting",
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json({ sessions: waitingSessions });
	} catch (error) {
		console.error("Failed to fetch waiting sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch waiting sessions" },
			{ status: 500 },
		);
	}
}
