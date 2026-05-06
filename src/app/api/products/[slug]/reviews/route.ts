import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/modules/reviews/review.service";
import { productService } from "@/modules/products/product.service";
import { reviewQuerySchema } from "@/modules/reviews/review.validators";
import { toErrorResponse } from "@/modules/shared/errors";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const parsed = reviewQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const product = await productService.getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await reviewService.listForProduct(product.id, parsed.data);
    return NextResponse.json(reviews);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
