import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/payments/payment.service";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    paymentService.verifyStripeWebhook(payload, request.headers.get("stripe-signature"));

    const event = JSON.parse(payload) as {
      type: string;
      data: { object: { id: string; last_payment_error?: { message?: string } } };
    };

    if (event.type === "payment_intent.succeeded") {
      await paymentService.markPaid("stripe", event.data.object.id);
    }

    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      await paymentService.markFailed(
        "stripe",
        event.data.object.id,
        event.data.object.last_payment_error?.message ?? event.type
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
