import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/payments/payment.service";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json() as {
      event_type: string;
      resource: {
        id?: string;
        supplementary_data?: { related_ids?: { order_id?: string } };
        status_details?: { reason?: string };
      };
    };

    await paymentService.verifyPaypalWebhook(request.headers, event);

    const paypalOrderId =
      event.resource.supplementary_data?.related_ids?.order_id ?? event.resource.id;

    if (
      paypalOrderId &&
      (event.event_type === "CHECKOUT.ORDER.APPROVED" ||
        event.event_type === "PAYMENT.CAPTURE.COMPLETED")
    ) {
      await paymentService.markPaid("paypal", paypalOrderId);
    }

    if (
      paypalOrderId &&
      (event.event_type === "CHECKOUT.ORDER.VOIDED" ||
        event.event_type === "PAYMENT.CAPTURE.DENIED" ||
        event.event_type === "PAYMENT.CAPTURE.REFUNDED")
    ) {
      await paymentService.markFailed(
        "paypal",
        paypalOrderId,
        event.resource.status_details?.reason ?? event.event_type
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
