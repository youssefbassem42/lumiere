import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/auth.service";
import { resetPasswordSchema } from "@/modules/auth/auth.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
