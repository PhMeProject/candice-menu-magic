import { useState, useMemo } from "react";
import { Plus, Search, Images } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MealCard } from "@/components/MealCard";
import { AddMealDialog } from "@/components/AddMealDialog";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { MealDetailSheet } from "@/components/MealDetailSheet";
import { ExportDataButton } from "@/components/ExportDataButton";

import { useMeals } from "@/hooks/useMeals";
import { usePlan } from "@/hooks/usePlan";
import type { Meal } from "@/types/meal";

const Index = () => {
  const { meals, addMeal, updateMeal, deleteMeal } = useMeals();
  const { removeMeal: removeMealFromPlan } = usePlan();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [detailMeal, setDetailMeal] = useState<Meal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return meals;
    const q = search.toLowerCase();
    return meals.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [meals, search]);

  const handleSave = (meal: Meal) => {
    if (editMeal) updateMeal(meal);
    else addMeal(meal);
    setEditMeal(null);
  };

  const handleBulkSave = (newMeals: Meal[]) => {
    newMeals.forEach(addMeal);
  };

  const handleCardClick = (meal: Meal) => {
    setDetailMeal(meal);
    setDetailOpen(true);
  };

  const handleEdit = (meal: Meal) => {
    setEditMeal(meal);
    setAddOpen(true);
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-2xl font-bold">My Meals</h1>
          <ExportDataButton />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals or ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-muted/50"
          />
        </div>
      </header>

      {/* Grid */}
      <section className="px-4 pt-2">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((meal) => (
              <MealCard key={meal.id} meal={meal} onClick={handleCardClick} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-warm-peach p-5 mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold mb-1">No meals yet</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
              Tap the + button to add your first meal to the library
            </p>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No meals match "{search}"
          </p>
        )}
      </section>

      {/* FABs */}
      <div className="fixed right-5 z-50 flex flex-col gap-3" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <Button
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full shadow-md"
          onClick={() => setBulkOpen(true)}
        >
          <Images className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            setEditMeal(null);
            setAddOpen(true);
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialogs */}
      <AddMealDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setEditMeal(null);
        }}
        onSave={handleSave}
        editMeal={editMeal}
      />


      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSaveAll={handleBulkSave}
      />

      <MealDetailSheet
        meal={detailMeal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={(id) => {
          deleteMeal(id);
          removeMealFromPlan(id);
        }}
      />
    </main>
  );
};

export default Index;
