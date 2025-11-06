import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// biome-ignore lint/style/noNonNullAssertion: Stripe key is required for payment processing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { slotId, userId, price } = body;

		if (!slotId || !userId || !price) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Stripe Checkoutセッションを作成
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "jpy",
						product_data: {
							name: "恋ai パートナー練習セッション",
							description: "実際のパートナーとの会話練習セッション",
						},
						unit_amount: price,
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&slot_id=${slotId}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book?canceled=true`,
			metadata: {
				slotId,
				userId,
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}
