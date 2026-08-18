import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { wishlistService } from "@/modules/wishlist/wishlist.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const { productId } = await params;
    await wishlistService.removeItem(session.user.id, productId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
