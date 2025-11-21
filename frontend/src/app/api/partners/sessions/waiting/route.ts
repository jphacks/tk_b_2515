import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const partnerIdQuery = searchParams.get("partnerId");

		const session = await auth.api.getSession({
			headers: req.headers,
		});

		const requesterId = session?.user?.id;
		const requesterRole = (session?.user as { role?: string } | undefined)
			?.role;

		if (!partnerIdQuery && requesterRole === "partner" && requesterId) {
			searchParams.set("partnerId", requesterId);
		}

		const partnerFilter = partnerIdQuery || undefined;

		const waitingSessions = await prisma.humanPartnerSession.findMany({
			where: {
				status: "waiting",
				...(partnerFilter ? { partnerId: partnerFilter } : {}),
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
				partner: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json({
			sessions: waitingSessions.map((session) => ({
				id: session.id,
				status: session.status,
				createdAt: session.createdAt.toISOString(),
				user: session.user,
				partner: session.partner,
			})),
		});
	} catch (error) {
		console.error("Failed to fetch waiting sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch waiting sessions" },
			{ status: 500 },
		);
	}
}
