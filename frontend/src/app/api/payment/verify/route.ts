import { PrismaClient } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const prisma = new PrismaClient();
// biome-ignore lint/style/noNonNullAssertion: Stripe key is required for payment processing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { checkoutSessionId, slotId } = body;

		if (!checkoutSessionId || !slotId) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Stripe Checkoutセッションを取得して決済を確認
		const checkoutSession =
			await stripe.checkout.sessions.retrieve(checkoutSessionId);

		if (checkoutSession.payment_status !== "paid") {
			return NextResponse.json(
				{ error: "Payment not completed" },
				{ status: 400 },
			);
		}

		const userId = checkoutSession.metadata?.userId;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID not found in session metadata" },
				{ status: 400 },
			);
		}

		// トランザクション内で予約を確定
		const result = await prisma.$transaction(async (tx) => {
			// 枠が存在し、まだ予約可能か確認
			const slot = await tx.practiceSlot.findUnique({
				where: { id: slotId },
			});

			if (!slot) {
				throw new Error("Slot not found");
			}

			if (slot.status !== "available") {
				throw new Error("Slot is no longer available");
			}

			// HumanPartnerSessionを作成
			const session = await tx.humanPartnerSession.create({
				data: {
					userId,
					partnerId: slot.partnerId,
					status: "waiting",
				},
			});

			// スロットを予約済みに更新
			await tx.practiceSlot.update({
				where: { id: slotId },
				data: {
					status: "booked",
					bookedByUserId: userId,
					bookedAt: new Date(),
					sessionId: session.id,
				},
			});

			return { sessionId: session.id };
		});

		return NextResponse.json({
			success: true,
			sessionId: result.sessionId,
		});
	} catch (error) {
		console.error("Error verifying payment:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to verify payment",
			},
			{ status: 500 },
		);
	}
}
