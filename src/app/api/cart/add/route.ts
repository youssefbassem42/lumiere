import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/modules/cart/cart.service";
import { addCartItemSchema } from "@/modules/cart/cart.validators";
import { ensureGuestCookie, getCartIdentity } from "@/modules/cart/cart.http";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const parsed = addCartItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const identity = await getCartIdentity(request);
    const response = NextResponse.json({});
    const guestId = identity.guestId ?? ensureGuestCookie(request, response);
    const cart = await cartService.addItem(
      { userId: identity.userId, guestId },
      parsed.data.productId,
      parsed.data.quantity
    );

    return NextResponse.json(cart, { status: 201, headers: response.headers });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
