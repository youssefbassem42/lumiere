import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { userService, updateProfileSchema } from "@/modules/users/user.service";
import { AppError, toErrorResponse } from "@/modules/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const user = await userService.getUser(session.user.id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    // don't leak password
    const { password, ...safeUser } = user as any;
    return NextResponse.json(safeUser);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await userService.updateProfile(session.user.id, parsed.data);
    const { password, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
