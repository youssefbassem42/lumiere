import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkoutService } from "@/modules/checkout/checkout.service";
import { checkoutSchema } from "@/modules/checkout/checkout.validators";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const checkout = await checkoutService.startCheckout(session.user.id, parsed.data);
    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
