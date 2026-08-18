import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { reviewService } from "@/modules/reviews/review.service";
import { reviewCreateSchema } from "@/modules/reviews/review.validators";
import { toErrorResponse } from "@/modules/shared/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const review = await reviewService.createReview(session.user.id, parsed.data);
    return NextResponse.json({ message: "Review submitted", review }, { status: 201 });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
