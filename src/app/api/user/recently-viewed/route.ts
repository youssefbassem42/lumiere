import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { recentlyViewedService } from "@/modules/users/recently-viewed.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const products = await recentlyViewedService.getRecentProducts(session.user.id);
    return NextResponse.json(products);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const addSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const result = await recentlyViewedService.addProduct(session.user.id, parsed.data.productId);
    return NextResponse.json(result);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
