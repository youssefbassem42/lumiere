import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError, toErrorResponse } from "@/modules/shared/errors";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(2),
  country: z.string().min(2),
  city: z.string().min(2),
  street: z.string().min(2),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Address validation failed:", parsed.error.format());
      throw new AppError("Invalid data", 400, "BAD_REQUEST", parsed.error.flatten().fieldErrors);
    }

    const userId = session.user.id;

    // If setting as default, unset others
    if (parsed.data.isDefault) {
      await db.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
