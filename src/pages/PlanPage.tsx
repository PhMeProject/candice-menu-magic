import { useMemo } from "react";
import { useMeals } from "@/hooks/useMeals";
import { usePlan } from "@/hooks/usePlan";
import { PlanMealCard } from "@/components/PlanMealCard";
import { PlanTray } from "@/components/PlanTray";
import { CalendarDays } from "lucide-react";
import type { Meal } from "@/types/meal";

function getIngredientNames(meal: Meal): Set<string> {
  return new Set(meal.ingredients.map((i) => i.name.toLowerCase().trim()));
}

function countOverlap(selected: Meal[], candidate: Meal): number {
  const candidateIngs = getIngredientNames(candidate);
  const selectedIngs = new Set<string>();
  for (const m of selected) {
    for (const name of getIngredientNames(m)) selectedIngs.add(name);
  }
  let count = 0;
  for (const name of candidateIngs) {
    if (selectedIngs.has(name)) count++;
  }
  return count;
}

const PlanPage = () => {
  const { meals } = useMeals();
  const { plan, toggleMeal, setServings, clearPlan } = usePlan();

  const selectedIds = useMemo(() => new Set(plan.map((p) => p.mealId)), [plan]);
  const selectedMeals = useMemo(
    () => meals.filter((m) => selectedIds.has(m.id)),
    [meals, selectedIds]
  );

  // Sort: selected first, then by overlap count descending
  const sortedMeals = useMemo(() => {
    if (selectedMeals.length === 0) return meals;

    return [...meals].sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (!aSelected && !bSelected) {
        return countOverlap(selectedMeals, b) - countOverlap(selectedMeals, a);
      }
      return 0;
    });
  }, [meals, selectedMeals, selectedIds]);

  const hasAnchor = selectedMeals.length > 0;

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <h1 className="font-display text-2xl font-bold mb-1">Plan Your Week</h1>
        <p className="text-sm text-muted-foreground">
          {hasAnchor
            ? "Meals with shared ingredients are highlighted"
            : "Tap a meal to start building your plan"}
        </p>
      </header>

      <section className="px-4 pt-2">
        {meals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedMeals.map((meal) => (
              <PlanMealCard
                key={meal.id}
                meal={meal}
                selected={selectedIds.has(meal.id)}
                overlapCount={
                  selectedIds.has(meal.id) ? 0 : countOverlap(selectedMeals, meal)
                }
                hasAnchor={hasAnchor}
                onClick={() => toggleMeal(meal.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-warm-peach p-5 mb-4">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">No meals in library</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
              Add some meals to your library first, then come back to plan your week
            </p>
          </div>
        )}
      </section>

      <PlanTray
        plan={plan}
        meals={meals}
        onSetServings={setServings}
        onClear={clearPlan}
      />
    </main>
  );
};

export default PlanPage;
