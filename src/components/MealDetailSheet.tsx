import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Meal } from "@/types/meal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MealDetailSheetProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
}

export function MealDetailSheet({ meal, open, onOpenChange, onEdit, onDelete }: MealDetailSheetProps) {
  if (!meal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto bg-card p-0 sm:max-w-md">
        <div className="relative aspect-video w-full">
          <img src={meal.photo} alt={meal.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        </div>

        <div className="p-5 space-y-4">
          <SheetHeader className="p-0">
            <SheetTitle className="font-display text-2xl">{meal.name}</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ingredients
            </h4>
            <div className="space-y-1.5">
              {meal.ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-2 text-sm">
                  <span className={ing.alwaysHave ? "text-muted-foreground line-through" : ""}>
                    {ing.name}
                  </span>
                  {ing.alwaysHave && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      always have
                    </Badge>
                  )}
                  {ing.substitute && (
                    <span className="text-xs text-muted-foreground">
                      (or {ing.substitute})
                    </span>
                  )}
                </div>
              ))}
              {meal.ingredients.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No ingredients added</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1 rounded-xl"
              onClick={() => {
                onOpenChange(false);
                onEdit(meal);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {meal.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this meal from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(meal.id);
                      onOpenChange(false);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
