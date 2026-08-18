import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { reviewService } from "@/modules/reviews/review.service";
import { reviewReplySchema } from "@/modules/reviews/review.validators";
import { toErrorResponse } from "@/modules/shared/errors";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
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
    const reply = await reviewService.updateReply(session.user.id, id, parsed.data);
    return NextResponse.json({ message: "Reply updated", reply });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getRequestSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    await reviewService.deleteReply(session.user.id, id);
    return NextResponse.json({ message: "Reply deleted" });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
