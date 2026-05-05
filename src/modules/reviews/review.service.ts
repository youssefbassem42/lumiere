import { AppError } from "@/modules/shared/errors";
import { cacheDelPattern } from "@/lib/redis";
import { reviewRepository } from "./review.repository";
import type {
  ReviewCreateInput,
  ReviewQueryInput,
  ReviewReplyInput,
  ReviewUpdateInput,
} from "./review.validators";

const blockedTerms = [
  "hate speech",
  "kill yourself",
  "scam link",
  "free money",
  "buy followers",
];

function validateContent(comment: string) {
  const normalized = comment.toLowerCase();
  if (!comment.trim()) {
    throw new AppError("Review cannot be empty", 422, "EMPTY_REVIEW");
  }
  if (/(.)\1{12,}/.test(normalized) || /(https?:\/\/\S+){2,}/.test(normalized)) {
    throw new AppError("Review looks like spam", 422, "SPAM_REVIEW");
  }
  if (blockedTerms.some((term) => normalized.includes(term))) {
    throw new AppError("Review contains blocked content", 422, "BLOCKED_REVIEW");
  }
}

export const reviewService = {
  canReview(userId: string | undefined, productId: string) {
    if (!userId) return Promise.resolve(false);
    return reviewRepository.hasPurchasedProduct(userId, productId);
  },

  async createReview(userId: string, data: ReviewCreateInput) {
    validateContent(data.comment);

    const hasPurchased = await reviewRepository.hasPurchasedProduct(userId, data.productId);
    if (!hasPurchased) {
      throw new AppError("Not allowed to review this product", 403, "REVIEW_NOT_ALLOWED");
    }

    const existing = await reviewRepository.findByUserAndProduct(userId, data.productId);
    if (existing) {
      throw new AppError("You already reviewed this product", 409, "REVIEW_EXISTS");
    }

    const review = await reviewRepository.create(userId, data);
    await cacheDelPattern("products*");
    await cacheDelPattern("product:*");
    return review;
  },

  async updateReview(userId: string, reviewId: string, data: ReviewUpdateInput) {
    if (data.comment) validateContent(data.comment);

    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    if (review.userId !== userId) {
      throw new AppError("You can only edit your own review", 403, "REVIEW_FORBIDDEN");
    }

    const updated = await reviewRepository.update(reviewId, data);
    await cacheDelPattern("products*");
    await cacheDelPattern("product:*");
    return updated;
  },

  async deleteReview(userId: string, reviewId: string) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    if (review.userId !== userId) {
      throw new AppError("You can only delete your own review", 403, "REVIEW_FORBIDDEN");
    }

    await reviewRepository.delete(reviewId);
    await cacheDelPattern("products*");
    await cacheDelPattern("product:*");
  },

  listForProduct(productId: string, query: ReviewQueryInput) {
    return reviewRepository.listForProduct(productId, query);
  },

  async createReply(userId: string, reviewId: string, data: ReviewReplyInput) {
    validateContent(data.comment);
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    return reviewRepository.createReply(userId, reviewId, data.comment);
  },

  async updateReply(userId: string, replyId: string, data: ReviewReplyInput) {
    validateContent(data.comment);
    const reply = await reviewRepository.findReplyById(replyId);
    if (!reply) throw new AppError("Reply not found", 404, "REPLY_NOT_FOUND");
    if (reply.userId !== userId) {
      throw new AppError("You can only edit your own reply", 403, "REPLY_FORBIDDEN");
    }
    return reviewRepository.updateReply(replyId, data.comment);
  },

  async deleteReply(userId: string, replyId: string) {
    const reply = await reviewRepository.findReplyById(replyId);
    if (!reply) throw new AppError("Reply not found", 404, "REPLY_NOT_FOUND");
    if (reply.userId !== userId) {
      throw new AppError("You can only delete your own reply", 403, "REPLY_FORBIDDEN");
    }
    await reviewRepository.deleteReply(replyId);
  },
};
