import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { reviewService } from "@/modules/reviews/review.service";
import { reviewReplySchema } from "@/modules/reviews/review.validators";
import { toErrorResponse } from "@/modules/shared/errors";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { id } = await params;
    const reply = await reviewService.createReply(session.user.id, id, parsed.data);
    return NextResponse.json({ message: "Reply added", reply }, { status: 201 });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
