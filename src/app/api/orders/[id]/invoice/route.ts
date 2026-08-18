import { NextRequest } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { generateInvoicePdf } from "@/modules/orders/invoice.service";
import { orderService } from "@/modules/orders/order.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const { id } = await params;
    const order = await orderService.getOrder(session.user.id, id);
    const pdf = generateInvoicePdf(order);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
