import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { userService, updatePasswordSchema } from "@/modules/users/user.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = updatePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await userService.updatePassword(session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
