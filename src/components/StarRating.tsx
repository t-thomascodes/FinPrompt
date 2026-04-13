"use client";

type Props = {
  rating: number;
  onRate: (n: number) => void;
  size?: "sm" | "md";
  stopPropagation?: boolean;
};

export function StarRating({
  rating,
  onRate,
  size = "sm",
  stopPropagation = false,
}: Props) {
  const cls = size === "md" ? "text-xl" : "text-sm";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            onRate(star);
          }}
          className={`${cls} cursor-pointer border-none bg-transparent p-0 leading-none text-fp-text-ghost hover:text-fp-warning/80`}
          style={{ color: rating >= star ? "#EF9F27" : undefined }}
          aria-label={`Rate ${star} of 5`}
        >
          {"\u2605"}
        </button>
      ))}
    </div>
  );
}
