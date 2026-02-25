import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meal } from "@/types/meal";

interface PlanMealCardProps {
  meal: Meal;
  selected: boolean;
  overlapCount: number;
  hasAnchor: boolean;
  onClick: () => void;
}

export function PlanMealCard({ meal, selected, overlapCount, hasAnchor, onClick }: PlanMealCardProps) {
  const dimmed = hasAnchor && !selected && overlapCount === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
        dimmed && "opacity-40 saturate-50"
      )}
    >
      <img
        src={meal.photo}
        alt={meal.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 rounded-full bg-primary p-1 shadow-lg">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Overlap badge */}
      {hasAnchor && !selected && overlapCount > 0 && (
        <div className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow">
          {overlapCount} shared
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-left font-display text-base font-bold text-white drop-shadow-md leading-tight">
          {meal.name}
        </h3>
      </div>
    </button>
  );
}
