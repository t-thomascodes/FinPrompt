"use client";

import { normalizeStarRating } from "@/lib/normalizeRating";

type Props = {
  rating: number;
  onRate: (n: number) => void;
  size?: "sm" | "md";
  stopPropagation?: boolean;
};

const STAR_PATH =
  "M12 2.5l2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.9 6.18 20.42l1.11-6.48L2.58 9.35l6.51-.95L12 2.5z";

function StarGlyph({ filled, px }: { filled: boolean; px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className="shrink-0"
      aria-hidden
    >
      <path
        d={STAR_PATH}
        fill={filled ? "#EF9F27" : "none"}
        stroke={filled ? "#E38B1F" : "#9CA3AF"}
        strokeWidth={filled ? 1 : 1.35}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRating({
  rating,
  onRate,
  size = "sm",
  stopPropagation = false,
}: Props) {
  const px = size === "md" ? 22 : 15;
  const value = normalizeStarRating(rating);
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rating ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              if (stopPropagation) e.stopPropagation();
              onRate(star);
            }}
            className="cursor-pointer border-none bg-transparent p-0 leading-none transition-opacity hover:opacity-90"
            aria-label={`Rate ${star} of 5`}
          >
            <StarGlyph filled={filled} px={px} />
          </button>
        );
      })}
    </div>
  );
}
