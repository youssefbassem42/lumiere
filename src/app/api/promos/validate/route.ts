import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) throw new AppError("Code is required", 400, "BAD_REQUEST");

    const promo = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new AppError("Invalid or inactive promo code", 404, "NOT_FOUND");
    }

    if (promo.expiryDate && promo.expiryDate < new Date()) {
      throw new AppError("Promo code has expired", 410, "GONE");
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new AppError("Promo code usage limit reached", 429, "LIMIT_REACHED");
    }

    return NextResponse.json({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
