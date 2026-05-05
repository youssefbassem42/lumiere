import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/auth.service";
import { registerSchema } from "@/modules/auth/auth.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { name, email, password, birthDate, gender } = parsed.data;
    const user = await authService.register({ name, email, password, birthDate, gender });

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account.", user },
      { status: 201 }
    );
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
