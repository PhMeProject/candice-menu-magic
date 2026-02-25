import { useMemo } from "react";
import { useMeals } from "@/hooks/useMeals";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ClipboardCopy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal, Ingredient } from "@/types/meal";

interface GroceryItem {
  name: string;
  substitute?: string;
  mealNames: string[];
  servingsTotal: number;
}

function buildGroceryList(meals: Meal[], plan: { mealId: string; servings: number }[]): GroceryItem[] {
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const itemMap = new Map<string, GroceryItem>();

  for (const p of plan) {
    const meal = mealMap.get(p.mealId);
    if (!meal) continue;

    for (const ing of meal.ingredients) {
      if (ing.alwaysHave) continue;

      const key = ing.name.toLowerCase().trim();
      const existing = itemMap.get(key);
      if (existing) {
        existing.servingsTotal += p.servings;
        if (!existing.mealNames.includes(meal.name)) {
          existing.mealNames.push(meal.name);
        }
        if (ing.substitute && !existing.substitute) {
          existing.substitute = ing.substitute;
        }
      } else {
        itemMap.set(key, {
          name: ing.name,
          substitute: ing.substitute,
          mealNames: [meal.name],
          servingsTotal: p.servings,
        });
      }
    }
  }

  return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function formatExportText(
  items: GroceryItem[],
  meals: Meal[],
  plan: { mealId: string; servings: number }[]
): string {
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  let text = "🍽️ WEEKLY MEAL PLAN\n";
  text += "─".repeat(24) + "\n";
  for (const p of plan) {
    const meal = mealMap.get(p.mealId);
    if (!meal) continue;
    text += `• ${meal.name}${p.servings > 1 ? ` (×${p.servings})` : ""}\n`;
  }
  text += "\n🛒 GROCERY LIST\n";
  text += "─".repeat(24) + "\n";
  for (const item of items) {
    let line = `☐ ${item.name}`;
    if (item.servingsTotal > 1) line += ` (×${item.servingsTotal})`;
    if (item.substitute) line += ` — or ${item.substitute}`;
    text += line + "\n";
  }
  return text;
}

const GroceryPage = () => {
  const { meals } = useMeals();
  const { plan } = usePlan();
  const { toast } = useToast();

  const items = useMemo(() => buildGroceryList(meals, plan), [meals, plan]);

  const handleCopy = async () => {
    const text = formatExportText(items, meals, plan);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Meal plan & grocery list copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please try again", variant: "destructive" });
    }
  };

  const hasPlan = plan.length > 0;

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Grocery List</h1>
            {hasPlan && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {items.length} item{items.length !== 1 ? "s" : ""} from {plan.length} meal{plan.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {hasPlan && items.length > 0 && (
            <Button size="sm" variant="secondary" className="rounded-xl gap-1.5" onClick={handleCopy}>
              <ClipboardCopy className="h-4 w-4" />
              Copy
            </Button>
          )}
        </div>
      </header>

      <section className="px-4 pt-2">
        {!hasPlan ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-warm-peach p-5 mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">No meals planned</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
              Head to the Plan tab and select meals for your week to generate a grocery list
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-accent/20 p-5 mb-4">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">All set!</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
              All ingredients are marked as "always have" — nothing to buy
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.name.toLowerCase()}
                className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm"
              >
                <div className="mt-0.5 h-5 w-5 rounded border-2 border-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">{item.name}</span>
                    {item.servingsTotal > 1 && (
                      <span className="text-xs text-muted-foreground">×{item.servingsTotal}</span>
                    )}
                  </div>
                  {item.substitute && (
                    <p className="text-xs text-accent mt-0.5">or {item.substitute}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {item.mealNames.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default GroceryPage;
