import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/auth/auth.service";
import { registerSchema } from "@/modules/auth/auth.validators";

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

    const { name, email, password } = parsed.data;
    const user = await authService.register({ name, email, password });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Email already in use") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
