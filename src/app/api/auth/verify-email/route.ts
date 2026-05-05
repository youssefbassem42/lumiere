import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/auth.service";
import { verifyEmailSchema } from "@/modules/auth/auth.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    await authService.verifyEmail(parsed.data.token);
    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
