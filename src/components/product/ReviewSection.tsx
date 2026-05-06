"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import type { ReviewsResponseDTO } from "@/modules/reviews/review.types";

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  canReview: boolean;
  initialReviews: ReviewsResponseDTO;
}

export function ReviewSection({ productId, productSlug, canReview, initialReviews }: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [sort, setSort] = useState<"newest" | "highest">("newest");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReviews(nextSort = sort) {
    const res = await fetch(`/api/products/${productSlug}/reviews?sort=${nextSort}`, {
      cache: "no-store",
    });
    if (res.ok) setReviews(await res.json());
  }

  async function handleSortChange(nextSort: "newest" | "highest") {
    setSort(nextSort);
    await loadReviews(nextSort);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to submit review.");
        return;
      }
      setMessage("Review submitted.");
      setComment("");
      setRating(5);
      await loadReviews();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-14 border-t border-zinc-100 pt-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Customer reviews</h2>
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={reviews.summary.avgRating} size="md" />
            <span className="text-sm font-medium text-zinc-900">{reviews.summary.avgRating.toFixed(1)}</span>
            <span className="text-sm text-zinc-400">({reviews.summary.reviewCount} reviews)</span>
          </div>
        </div>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as "newest" | "highest")}
          className="input md:w-48"
          aria-label="Sort reviews"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest rating</option>
        </select>
      </div>

      {!canReview && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          Only customers who purchased this product can review it
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                disabled={!canReview}
                onClick={() => setRating(value)}
                className={`text-2xl leading-none ${value <= rating ? "text-yellow-400" : "text-zinc-300"} disabled:opacity-50`}
                aria-label={`${value} star rating`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Review
          </label>
          <textarea
            id="review-comment"
            disabled={!canReview}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input min-h-28 py-3 resize-y disabled:bg-zinc-50"
            placeholder="Share your experience with this product"
            required
          />
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!canReview || loading} className="btn btn-primary">
          {loading ? "Submitting..." : "Submit review"}
        </button>
      </form>

      <div className="space-y-4">
        {reviews.data.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          reviews.data.map((review) => (
            <article key={review.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{review.user.name ?? "Verified customer"}</p>
                    {review.isVerifiedPurchase && (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700">Verified</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed mt-3">{review.comment}</p>
              {review.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4">
                  {review.replies.map((reply) => (
                    <div key={reply.id}>
                      <p className="text-xs font-medium text-zinc-700">{reply.user.name ?? "Lumière"}</p>
                      <p className="text-sm text-zinc-500">{reply.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
