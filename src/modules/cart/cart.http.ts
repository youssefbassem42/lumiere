import { randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import type { CartIdentity } from "./cart.types";

export const GUEST_CART_COOKIE = "lumiere_guest_id";

export async function getCartIdentity(request: NextRequest): Promise<CartIdentity> {
  const session = await getRequestSession(request);
  const userId = session?.user?.id;
  const guestId = request.cookies.get(GUEST_CART_COOKIE)?.value;
  return { userId, guestId };
}

export function ensureGuestCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;

  const guestId = randomUUID();
  response.cookies.set(GUEST_CART_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return guestId;
}
