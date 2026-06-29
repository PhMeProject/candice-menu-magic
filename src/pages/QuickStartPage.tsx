import { useState, useMemo } from "react";
import { Zap, Plus, Trash2, ChevronLeft, ClipboardCopy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMeals } from "@/hooks/useMeals";
import { usePresets } from "@/hooks/usePresets";
import { useToast } from "@/hooks/use-toast";
import type { Meal, MealPreset } from "@/types/meal";

// ── Grocery list builder (same logic as GroceryPage, servings = 1 per meal) ──

interface GroceryItem {
  name: string;
  substitute?: string;
  mealNames: string[];
}

function buildGroceryList(meals: Meal[], mealIds: string[]): GroceryItem[] {
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const itemMap = new Map<string, GroceryItem>();

  for (const id of mealIds) {
    const meal = mealMap.get(id);
    if (!meal) continue;
    for (const ing of meal.ingredients) {
      if (ing.alwaysHave) continue;
      const key = ing.name.toLowerCase().trim();
      const existing = itemMap.get(key);
      if (existing) {
        if (!existing.mealNames.includes(meal.name)) existing.mealNames.push(meal.name);
        if (ing.substitute && !existing.substitute) existing.substitute = ing.substitute;
      } else {
        itemMap.set(key, { name: ing.name, substitute: ing.substitute, mealNames: [meal.name] });
      }
    }
  }

  return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Create Preset Dialog ──────────────────────────────────────────────────────

interface CreatePresetProps {
  meals: Meal[];
  onSave: (name: string, mealIds: string[]) => void;
  onCancel: () => void;
}

function CreatePreset({ meals, onSave, onCancel }: CreatePresetProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canSave = name.trim().length > 0 && selected.size >= 1;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold">New Preset</h1>
        </div>
        <Input
          placeholder="Preset name (e.g. Chicken Week)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
          autoFocus
        />
        <p className="text-xs text-muted-foreground mt-2">
          {selected.size} meal{selected.size !== 1 ? "s" : ""} selected
        </p>
      </header>

      <section className="px-4 pt-2 flex-1">
        {meals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">
            No meals in your library yet. Add some first.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {meals.map((meal) => {
              const active = selected.has(meal.id);
              return (
                <button
                  key={meal.id}
                  onClick={() => toggle(meal.id)}
                  className={cn(
                    "relative rounded-2xl overflow-hidden aspect-square text-left transition-all",
                    active ? "ring-2 ring-primary ring-offset-2" : "opacity-80"
                  )}
                >
                  {meal.photo ? (
                    <img src={meal.photo} alt={meal.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {active && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold leading-tight line-clamp-2">
                    {meal.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <Button
          className="w-full rounded-xl"
          disabled={!canSave}
          onClick={() => onSave(name.trim(), Array.from(selected))}
        >
          Save Preset
        </Button>
      </div>
    </div>
  );
}

// ── Preset Detail View ────────────────────────────────────────────────────────

interface PresetDetailProps {
  preset: MealPreset;
  meals: Meal[];
  onBack: () => void;
  onDelete: () => void;
}

function PresetDetail({ preset, meals, onBack, onDelete }: PresetDetailProps) {
  const { toast } = useToast();
  const mealMap = new Map(meals.map((m) => [m.id, m]));
  const presetMeals = preset.mealIds.map((id) => mealMap.get(id)).filter(Boolean) as Meal[];
  const groceryItems = useMemo(() => buildGroceryList(meals, preset.mealIds), [meals, preset.mealIds]);

  const handleCopy = async () => {
    let text = `⚡ ${preset.name}\n${"─".repeat(24)}\n`;
    for (const meal of presetMeals) text += `• ${meal.name}\n`;
    text += `\n🛒 GROCERY LIST\n${"─".repeat(24)}\n`;
    for (const item of groceryItems) {
      let line = `☐ ${item.name}`;
      if (item.substitute) line += ` — or ${item.substitute}`;
      text += line + "\n";
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Preset & grocery list copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl font-bold truncate max-w-[200px]">{preset.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="rounded-xl gap-1.5" onClick={handleCopy}>
              <ClipboardCopy className="h-4 w-4" />
              Copy
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="px-4 pt-2 space-y-6">
        {/* Meals */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Meals ({presetMeals.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {presetMeals.map((meal) => (
              <div key={meal.id} className="relative rounded-2xl overflow-hidden aspect-square">
                {meal.photo ? (
                  <img src={meal.photo} alt={meal.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold leading-tight line-clamp-2">
                  {meal.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grocery list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Grocery List ({groceryItems.length} items)
          </h2>
          {groceryItems.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Check className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm text-muted-foreground">All ingredients are marked "always have" — nothing to buy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groceryItems.map((item) => (
                <div
                  key={item.name.toLowerCase()}
                  className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm"
                >
                  <div className="mt-0.5 h-5 w-5 rounded border-2 border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{item.name}</span>
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
        </div>
      </section>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type View = "list" | "create" | { preset: MealPreset };

const QuickStartPage = () => {
  const { meals } = useMeals();
  const { presets, addPreset, deletePreset } = usePresets();
  const { toast } = useToast();
  const [view, setView] = useState<View>("list");

  const handleSave = (name: string, mealIds: string[]) => {
    const preset: MealPreset = {
      id: crypto.randomUUID(),
      name,
      mealIds,
      createdAt: Date.now(),
    };
    addPreset(preset);
    toast({ title: "Preset saved!", description: `"${name}" added to Quick Start` });
    setView("list");
  };

  const handleDelete = (preset: MealPreset) => {
    deletePreset(preset.id);
    toast({ title: "Preset deleted" });
    setView("list");
  };

  if (view === "create") {
    return <CreatePreset meals={meals} onSave={handleSave} onCancel={() => setView("list")} />;
  }

  if (typeof view === "object" && "preset" in view) {
    return (
      <PresetDetail
        preset={view.preset}
        meals={meals}
        onBack={() => setView("list")}
        onDelete={() => handleDelete(view.preset)}
      />
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Quick Start</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Saved meal plan presets</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setView("create")}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </header>

      <section className="px-4 pt-2">
        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-warm-peach p-5 mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">No presets yet</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
              Save a named collection of meals to quickly load a full week plan and grocery list
            </p>
            <Button className="mt-6 rounded-xl gap-1.5" onClick={() => setView("create")}>
              <Plus className="h-4 w-4" />
              Create your first preset
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {presets.map((preset) => {
              const mealMap = new Map(meals.map((m) => [m.id, m]));
              const presetMeals = preset.mealIds
                .map((id) => mealMap.get(id))
                .filter(Boolean) as Meal[];
              const thumbs = presetMeals.slice(0, 4);

              return (
                <button
                  key={preset.id}
                  onClick={() => setView({ preset })}
                  className="w-full rounded-2xl bg-card shadow-sm p-4 flex items-center gap-4 text-left hover:bg-accent/10 transition-colors"
                >
                  {/* Thumbnail collage */}
                  <div className="grid grid-cols-2 gap-0.5 w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    {thumbs.length > 0 ? (
                      thumbs.map((meal, i) =>
                        meal.photo ? (
                          <img
                            key={i}
                            src={meal.photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div key={i} className="w-full h-full bg-muted" />
                        )
                      )
                    ) : (
                      <div className="col-span-2 row-span-2 bg-muted flex items-center justify-center">
                        <Zap className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* Fill empty cells if fewer than 4 */}
                    {thumbs.length > 0 &&
                      Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-full h-full bg-muted" />
                      ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {presetMeals.length} meal{presetMeals.length !== 1 ? "s" : ""}
                      {presetMeals.length > 0 && (
                        <> · {presetMeals.map((m) => m.name).join(", ")}</>
                      )}
                    </p>
                  </div>

                  <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default QuickStartPage;
