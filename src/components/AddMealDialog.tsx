import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Camera, ArrowRightLeft } from "lucide-react";
import type { Meal, Ingredient } from "@/types/meal";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Meal) => void;
  editMeal?: Meal | null;
}

export function AddMealDialog({ open, onOpenChange, onSave, editMeal }: AddMealDialogProps) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync form when editMeal changes (opening in edit mode)
  const prevEditRef = useRef<Meal | null | undefined>(undefined);
  if (editMeal !== prevEditRef.current) {
    prevEditRef.current = editMeal;
    if (editMeal) {
      setName(editMeal.name);
      setPhoto(editMeal.photo);
      setIngredients([...editMeal.ingredients]);
      setNewIngredient("");
    }
  }

  const resetForm = () => {
    setName("");
    setPhoto("");
    setIngredients([]);
    setNewIngredient("");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetForm();
    else if (editMeal) {
      setName(editMeal.name);
      setPhoto(editMeal.photo);
      setIngredients([...editMeal.ingredients]);
    }
    onOpenChange(o);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      setPhoto(canvas.toDataURL("image/jpeg", 0.7));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: trimmed, alwaysHave: false },
    ]);
    setNewIngredient("");
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleAlwaysHave = (id: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, alwaysHave: !i.alwaysHave } : i))
    );
  };

  const setSubstitute = (id: string, sub: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, substitute: sub || undefined } : i))
    );
  };

  const handleSave = () => {
    if (!name.trim() || !photo) return;
    onSave({
      id: editMeal?.id ?? crypto.randomUUID(),
      name: name.trim(),
      photo,
      ingredients,
      createdAt: editMeal?.createdAt ?? Date.now(),
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editMeal ? "Edit Meal" : "Add New Meal"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Photo */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
            {photo ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="relative w-full aspect-video overflow-hidden rounded-xl border-2 border-dashed border-border"
              >
                <img src={photo} alt="Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full aspect-video items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
              >
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Add a photo</span>
                </div>
              </button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal Name</Label>
            <Input
              id="meal-name"
              placeholder="e.g., Pasta Carbonara"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredients</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add an ingredient…"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
              />
              <Button size="icon" variant="secondary" onClick={addIngredient} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-3">
              {ingredients.map((ing) => (
                <div key={ing.id} className="rounded-lg bg-muted/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{ing.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Always have</span>
                        <Switch
                          checked={ing.alwaysHave}
                          onCheckedChange={() => toggleAlwaysHave(ing.id)}
                        />
                      </div>
                      <button
                        onClick={() => removeIngredient(ing.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input
                      className="h-8 text-xs"
                      placeholder="Substitute (optional)"
                      value={ing.substitute ?? ""}
                      onChange={(e) => setSubstitute(ing.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={handleSave}
            disabled={!name.trim() || !photo}
          >
            {editMeal ? "Save Changes" : "Add Meal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
