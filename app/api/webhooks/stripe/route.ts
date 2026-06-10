import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        console.log("Subscription event:", {
          id: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });
        break;

      case "customer.subscription.deleted":
        console.log("Subscription deleted:", event.data.object.id);
        break;

      case "invoice.paid":
        console.log("Invoice paid:", event.data.object.id);
        break;

      case "invoice.payment_failed":
        console.log("Invoice payment failed:", event.data.object.id);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
