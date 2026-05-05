import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { wishlistService } from "@/modules/wishlist/wishlist.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const wishlist = await wishlistService.getWishlist(session.user.id);
    return NextResponse.json(wishlist);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const toggleSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const result = await wishlistService.toggleItem(session.user.id, parsed.data.productId);
    return NextResponse.json(result);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
