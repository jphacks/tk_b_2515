import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const payment = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

// Initialize Stripe
const getStripeInstance = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-09-30.clover",
  });
};

// Create Stripe checkout session
const createCheckoutSessionRoute = createRoute({
  method: "post",
  path: "/create-checkout-session",
  tags: ["Payment"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            partnerId: z.string(),
            partnerName: z.string(),
            amount: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Checkout session created",
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Failed to create checkout session",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

payment.openapi(createCheckoutSessionRoute, async (c) => {
  try {
    const { partnerId, partnerName, amount } = await c.req.json();
    const stripe = getStripeInstance();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `実践練習セッション - ${partnerName}`,
              description: "15分間のビデオ通話セッション",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      metadata: {
        partnerId,
        partnerName,
      },
    });

    return c.json({ sessionId: session.id }, 200);
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Verify payment and create partner session
const verifyPaymentSessionRoute = createRoute({
  method: "post",
  path: "/verify-session",
  tags: ["Payment"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Payment verified and session created",
      content: {
        "application/json": {
          schema: z.object({
            partnerSessionId: z.string(),
            paid: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Invalid request or payment not completed",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Failed to verify payment",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

payment.openapi(verifyPaymentSessionRoute, async (c) => {
  try {
    const { sessionId } = await c.req.json();
    const stripe = getStripeInstance();

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return c.json({ error: "Payment not completed" }, 400);
    }

    // Create partner session
    const partnerId = session.metadata?.partnerId;
    if (!partnerId) {
      return c.json({ error: "Partner ID not found" }, 400);
    }

    // TODO: Get userId from authenticated user
    const userId = "user-placeholder"; // Replace with actual user ID from auth

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const partnerSession = await prisma.humanPartnerSession.create({
      data: {
        userId,
        partnerId,
        status: "waiting",
        roomId,
      },
    });

    return c.json(
      {
        partnerSessionId: partnerSession.id,
        paid: true,
      },
      200
    );
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return c.json({ error: "Failed to verify payment" }, 500);
  }
});

// Stripe webhook endpoint
const stripeWebhookRoute = createRoute({
  method: "post",
  path: "/webhook",
  tags: ["Payment"],
  responses: {
    200: {
      description: "Webhook processed",
      content: {
        "application/json": {
          schema: z.object({
            received: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Invalid webhook payload",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Webhook processing failed",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

payment.openapi(stripeWebhookRoute, async (c) => {
  try {
    const stripe = getStripeInstance();
    const signature = c.req.header("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return c.json({ error: "Missing signature or webhook secret" }, 400);
    }

    const body = await c.req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return c.json({ error: "Invalid signature" }, 400);
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Payment successful:", session.id);
        // TODO: Additional processing (send email, update database, etc.)
        break;
      }
      case "payment_intent.succeeded": {
        console.log("Payment intent succeeded");
        break;
      }
      case "payment_intent.payment_failed": {
        console.log("Payment failed");
        break;
      }
      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default payment;
