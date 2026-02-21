import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
}

export default function StarRating({ rating, maxStars = 5 }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const isFilled = index < fullStars;
        const isHalf = index === fullStars && hasHalfStar;

        return (
          <Star
            key={index}
            className={`w-5 h-5 ${
              isFilled
                ? 'fill-[oklch(0.8_0.25_150)] text-[oklch(0.8_0.25_150)]'
                : isHalf
                ? 'fill-[oklch(0.8_0.25_150)]/50 text-[oklch(0.8_0.25_150)]'
                : 'text-muted-foreground'
            }`}
          />
        );
      })}
    </div>
  );
}
