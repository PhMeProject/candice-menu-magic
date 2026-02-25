import type { Meal } from "@/types/meal";

interface MealCardProps {
  meal: Meal;
  onClick: (meal: Meal) => void;
}

export function MealCard({ meal, onClick }: MealCardProps) {
  return (
    <button
      onClick={() => onClick(meal)}
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={meal.photo}
        alt={meal.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-left font-display text-lg font-bold text-white drop-shadow-md leading-tight">
          {meal.name}
        </h3>
        <p className="text-left text-xs text-white/80 mt-0.5">
          {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}
