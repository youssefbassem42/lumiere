interface StarRatingProps {
  rating: number;   // 0-5
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const sizeClass = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half = !filled && i < rating && rating - i >= 0.4;

        return (
          <svg
            key={i}
            className={`${sizeClass} ${filled || half ? "star-filled" : "star-empty"}`}
            fill={filled ? "currentColor" : half ? "url(#half)" : "none"}
            stroke="currentColor"
            strokeWidth={filled || half ? 0 : 1.5}
            viewBox="0 0 24 24"
          >
            {half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        );
      })}
    </div>
  );
}
