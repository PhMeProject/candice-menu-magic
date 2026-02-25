import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal, PlannedMeal } from "@/types/meal";

interface PlanTrayProps {
  plan: PlannedMeal[];
  meals: Meal[];
  onSetServings: (mealId: string, servings: number) => void;
  onClear: () => void;
}

export function PlanTray({ plan, meals, onSetServings, onClear }: PlanTrayProps) {
  if (plan.length === 0) return null;

  const mealMap = new Map(meals.map((m) => [m.id, m]));

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto max-w-lg px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            {plan.length} meal{plan.length !== 1 ? "s" : ""} selected
          </span>
          <button onClick={onClear} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {plan.map((p) => {
            const meal = mealMap.get(p.mealId);
            if (!meal) return null;
            return (
              <div key={p.mealId} className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-muted/60 pl-1 pr-2 py-1">
                <img src={meal.photo} alt={meal.name} className="h-8 w-8 rounded-md object-cover" />
                <span className="text-xs font-medium max-w-[80px] truncate">{meal.name}</span>
                <div className="flex items-center gap-0.5 ml-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => onSetServings(p.mealId, p.servings - 1)}
                    disabled={p.servings <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-bold w-4 text-center">×{p.servings}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => onSetServings(p.mealId, p.servings + 1)}
                    disabled={p.servings >= 10}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
