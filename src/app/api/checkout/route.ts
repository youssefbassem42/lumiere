import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkoutService } from "@/modules/checkout/checkout.service";
import { checkoutSchema } from "@/modules/checkout/checkout.validators";
import { AppError, toErrorResponse } from "@/modules/shared/errors";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = (await cookies()).get("guest_cart_id")?.value;
    
    if (!session?.user?.id && !guestId) {
      throw new AppError("Authentication required or missing guest cart", 401, "UNAUTHORIZED");
    }

    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (!session?.user?.id && !parsed.data.guestEmail) {
      throw new AppError("Email is required for guest checkout", 400, "MISSING_EMAIL");
    }

    const identity = { userId: session?.user?.id, guestId };
    const checkout = await checkoutService.startCheckout(identity, parsed.data);
    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
