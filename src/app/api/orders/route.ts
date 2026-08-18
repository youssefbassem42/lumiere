import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { orderService } from "@/modules/orders/order.service";
import { orderQuerySchema } from "@/modules/orders/order.validators";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const parsed = orderQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const orders = await orderService.getOrders(session.user.id, parsed.data);
    return NextResponse.json(orders);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
