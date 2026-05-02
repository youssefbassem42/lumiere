import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { orderService } from "@/modules/orders/order.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const { id } = await params;
    const order = await orderService.getOrder(session.user.id, id);
    return NextResponse.json(order);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
