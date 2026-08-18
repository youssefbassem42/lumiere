import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError, toErrorResponse } from "@/modules/shared/errors";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  street: z.string().min(2).optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const { id } = await params;
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("Invalid data", 400, "BAD_REQUEST", parsed.error.flatten().fieldErrors);
    }

    const address = await db.address.findUnique({ where: { id } });
    if (!address || address.userId !== session.user.id) {
      throw new AppError("Address not found", 404, "NOT_FOUND");
    }

    if (parsed.data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await db.address.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const { id } = await params;
    const address = await db.address.findUnique({ where: { id } });
    if (!address || address.userId !== session.user.id) {
      throw new AppError("Address not found", 404, "NOT_FOUND");
    }

    await db.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
