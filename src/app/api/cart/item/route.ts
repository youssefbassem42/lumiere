import { NextRequest, NextResponse } from "next/server";
import { cartService } from "@/modules/cart/cart.service";
import { ensureGuestCookie, getCartIdentity } from "@/modules/cart/cart.http";
import {
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/modules/cart/cart.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function PATCH(request: NextRequest) {
  try {
    const parsed = updateCartItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const identity = await getCartIdentity(request);
    const response = NextResponse.json({});
    const guestId = identity.guestId ?? ensureGuestCookie(request, response);
    const cart = await cartService.updateItem(
      { userId: identity.userId, guestId },
      parsed.data.productId,
      parsed.data.quantity
    );

    return NextResponse.json(cart, { headers: response.headers });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const parsed = removeCartItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cart payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const identity = await getCartIdentity(request);
    const response = NextResponse.json({});
    const guestId = identity.guestId ?? ensureGuestCookie(request, response);
    const cart = await cartService.removeItem(
      { userId: identity.userId, guestId },
      parsed.data.productId
    );

    return NextResponse.json(cart, { headers: response.headers });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
