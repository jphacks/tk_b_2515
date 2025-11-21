import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: req.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const role = (session.user as { role?: string }).role;
		if (role !== "partner") {
			return NextResponse.json(
				{ error: "Partner role required" },
				{ status: 403 },
			);
		}

		const body = (await req.json().catch(() => null)) as {
			isAvailable?: boolean;
		} | null;

		if (!body || typeof body.isAvailable !== "boolean") {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				isAvailable: body.isAvailable,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to update availability:", error);
		return NextResponse.json(
			{ error: "Failed to update availability" },
			{ status: 500 },
		);
	}
}
