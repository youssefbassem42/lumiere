export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
  };
  replies: ReviewReplyDTO[];
}

export interface ReviewReplyDTO {
  id: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

export interface ReviewsResponseDTO {
  data: ReviewDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    avgRating: number;
    reviewCount: number;
  };
}
