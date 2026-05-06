import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/payments/payment.service";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const body = JSON.parse(payload);
    
    // Verify signature
    await paymentService.verifyPaypalWebhook(request.headers, body);

    // Handle events
    if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
      const orderId = body.resource.id;
      await paymentService.markPaid("paypal", orderId);
    } else if (body.event_type === "PAYMENT.CAPTURE.DENIED") {
      const orderId = body.resource.id; // Or wherever PayPal stores the order reference
      await paymentService.markFailed("paypal", orderId, "Payment capture denied");
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PayPal Webhook Error:", message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }
}
