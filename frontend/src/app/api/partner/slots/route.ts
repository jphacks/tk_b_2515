import { PrismaClient } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// パートナーがスケジュールを登録
export async function POST(req: NextRequest) {
	try {
		// セッションからpartnerIdを取得
		const session = await auth.api.getSession({
			headers: req.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const partnerId = session.user.id;
		const body = await req.json();
		const { slots } = body;

		if (!Array.isArray(slots) || slots.length === 0) {
			return NextResponse.json(
				{ error: "Slots array is required" },
				{ status: 400 },
			);
		}

		// 複数の時間枠を一括作成
		const createdSlots = await Promise.all(
			slots.map(
				async (slot: {
					date: string;
					startTime: string;
					endTime: string;
					price: number;
				}) => {
					const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
					const endDateTime = new Date(`${slot.date}T${slot.endTime}:00`);

					return prisma.practiceSlot.create({
						data: {
							partnerId,
							startTime: startDateTime,
							endTime: endDateTime,
							price: slot.price,
							status: "available",
						},
					});
				},
			),
		);

		return NextResponse.json({
			success: true,
			slots: createdSlots,
		});
	} catch (error) {
		console.error("Error creating slots:", error);
		return NextResponse.json(
			{ error: "Failed to create slots" },
			{ status: 500 },
		);
	}
}

// 利用可能な時間枠を取得
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const partnerId = searchParams.get("partnerId");
		const status = searchParams.get("status") || "available";

		const where: {
			status: string;
			partnerId?: string;
			startTime?: { gte: Date };
		} = {
			status,
			startTime: {
				gte: new Date(), // 現在時刻以降の枠のみ
			},
		};

		if (partnerId) {
			where.partnerId = partnerId;
		}

		const slots = await prisma.practiceSlot.findMany({
			where,
			include: {
				partner: {
					select: {
						id: true,
						name: true,
						image: true,
						rating: true,
					},
				},
				bookedByUser: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				startTime: "asc",
			},
		});

		return NextResponse.json({ slots });
	} catch (error) {
		console.error("Error fetching slots:", error);
		return NextResponse.json(
			{ error: "Failed to fetch slots" },
			{ status: 500 },
		);
	}
}
