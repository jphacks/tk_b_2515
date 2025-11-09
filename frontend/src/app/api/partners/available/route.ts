import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const partnersList = await prisma.user.findMany({
			where: {
				isAvailable: true,
				role: "partner",
			},
			select: {
				id: true,
				name: true,
				rating: true,
				isAvailable: true,
			},
		});

		return NextResponse.json({ partners: partnersList });
	} catch (error) {
		console.error("Failed to fetch partners:", error);
		return NextResponse.json(
			{ error: "Failed to fetch partners" },
			{ status: 500 },
		);
	}
}
