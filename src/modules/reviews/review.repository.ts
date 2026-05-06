import { db } from "@/lib/db";
import type { ReviewQueryInput, ReviewUpdateInput } from "./review.validators";
import type { ReviewDTO, ReviewsResponseDTO } from "./review.types";

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  isVerifiedPurchase: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  replies: {
    select: {
      id: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

function mapReview(review: {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null };
  replies: {
    id: string;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string | null };
  }[];
}): ReviewDTO {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    replies: review.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
    })),
  };
}

async function refreshProductRating(productId: string) {
  const aggregate = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await db.product.update({
    where: { id: productId },
    data: {
      avgRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      reviewCount: aggregate._count.rating,
    },
  });
}

export const reviewRepository = {
  async hasPurchasedProduct(userId: string, productId: string) {
    const order = await db.order.findFirst({
      where: {
        userId,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        items: { some: { productId } },
      },
      select: { id: true },
    });
    return Boolean(order);
  },

  findByUserAndProduct(userId: string, productId: string) {
    return db.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  },

  findById(id: string) {
    return db.review.findUnique({ where: { id } });
  },

  findReplyById(id: string) {
    return db.reviewReply.findUnique({ where: { id } });
  },

  async create(userId: string, data: { productId: string; rating: number; comment: string }) {
    const review = await db.review.create({
      data: { ...data, userId, isVerifiedPurchase: true },
      select: reviewSelect,
    });
    await refreshProductRating(data.productId);
    return mapReview(review);
  },

  async update(reviewId: string, data: ReviewUpdateInput) {
    const review = await db.review.update({
      where: { id: reviewId },
      data,
      select: { ...reviewSelect, productId: true },
    });
    await refreshProductRating(review.productId);
    return mapReview(review);
  },

  async delete(reviewId: string) {
    const review = await db.review.delete({
      where: { id: reviewId },
      select: { productId: true },
    });
    await refreshProductRating(review.productId);
  },

  async listForProduct(productId: string, query: ReviewQueryInput): Promise<ReviewsResponseDTO> {
    const orderBy = query.sort === "highest" ? { rating: "desc" as const } : { createdAt: "desc" as const };
    const skip = (query.page - 1) * query.limit;

    const [total, product, reviews] = await db.$transaction([
      db.review.count({ where: { productId } }),
      db.product.findUnique({
        where: { id: productId },
        select: { avgRating: true, reviewCount: true },
      }),
      db.review.findMany({
        where: { productId },
        select: reviewSelect,
        orderBy,
        skip,
        take: query.limit,
      }),
    ]);

    return {
      data: reviews.map(mapReview),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        avgRating: product?.avgRating ?? 0,
        reviewCount: product?.reviewCount ?? 0,
      },
    };
  },

  async createReply(userId: string, reviewId: string, comment: string) {
    return db.reviewReply.create({
      data: { userId, reviewId, comment },
      select: {
        id: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  },

  updateReply(replyId: string, comment: string) {
    return db.reviewReply.update({
      where: { id: replyId },
      data: { comment },
    });
  },

  deleteReply(replyId: string) {
    return db.reviewReply.delete({ where: { id: replyId } });
  },
};
