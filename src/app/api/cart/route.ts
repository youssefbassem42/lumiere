import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/modules/cart/cart.service";
import { ensureGuestCookie, getCartIdentity } from "@/modules/cart/cart.http";
import { toErrorResponse } from "@/modules/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const identity = await getCartIdentity(request);
    const response = NextResponse.json({});
    const guestId = identity.guestId ?? ensureGuestCookie(request, response);

    const cart =
      identity.userId && identity.guestId
        ? await cartService.syncGuestCartToUser(identity.userId, identity.guestId)
        : await cartService.getCart({ userId: identity.userId, guestId });

    return NextResponse.json(cart, { headers: response.headers });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
