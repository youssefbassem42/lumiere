import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/auth.service";
import { forgotPasswordSchema } from "@/modules/auth/auth.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    await authService.requestPasswordReset(parsed.data.email);
    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
