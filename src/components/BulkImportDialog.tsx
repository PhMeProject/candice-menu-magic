import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X, ArrowRightLeft, Images, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { uploadMealPhoto } from "@/lib/photo-storage";
import type { Meal, Ingredient } from "@/types/meal";

interface PhotoDraft {
  photo: string; // cloud URL after upload
  name: string;
  ingredients: Ingredient[];
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAll: (meals: Meal[]) => void;
}

export function BulkImportDialog({ open, onOpenChange, onSaveAll }: BulkImportDialogProps) {
  const [drafts, setDrafts] = useState<PhotoDraft[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [newIngredient, setNewIngredient] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setDrafts([]);
    setCurrentIdx(0);
    setNewIngredient("");
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      setUploading(true);
      const urls = await Promise.all(files.map((f) => uploadMealPhoto(f)));
      setDrafts(urls.map((photo) => ({ photo, name: "", ingredients: [] })));
      setCurrentIdx(0);
    } catch (err) {
      console.error("Bulk upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, []);

  const draft = drafts[currentIdx];

  const updateDraft = (patch: Partial<PhotoDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === currentIdx ? { ...d, ...patch } : d)));
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (!trimmed || !draft) return;
    updateDraft({
      ingredients: [...draft.ingredients, { id: crypto.randomUUID(), name: trimmed, alwaysHave: false }],
    });
    setNewIngredient("");
  };

  const removeIngredient = (id: string) => {
    if (!draft) return;
    updateDraft({ ingredients: draft.ingredients.filter((i) => i.id !== id) });
  };

  const toggleAlwaysHave = (id: string) => {
    if (!draft) return;
    updateDraft({
      ingredients: draft.ingredients.map((i) => (i.id === id ? { ...i, alwaysHave: !i.alwaysHave } : i)),
    });
  };

  const setSubstitute = (id: string, sub: string) => {
    if (!draft) return;
    updateDraft({
      ingredients: draft.ingredients.map((i) => (i.id === id ? { ...i, substitute: sub || undefined } : i)),
    });
  };

  const removeDraft = () => {
    const next = drafts.filter((_, i) => i !== currentIdx);
    if (next.length === 0) {
      reset();
      return;
    }
    setDrafts(next);
    setCurrentIdx(Math.min(currentIdx, next.length - 1));
  };

  const canSave = drafts.length > 0 && drafts.every((d) => d.name.trim() && d.photo);

  const handleSaveAll = () => {
    const meals: Meal[] = drafts.map((d) => ({
      id: crypto.randomUUID(),
      name: d.name.trim(),
      photo: d.photo,
      ingredients: d.ingredients,
      createdAt: Date.now(),
    }));
    onSaveAll(meals);
    reset();
    onOpenChange(false);
  };

  // Phase 1: Pick photos
  if (drafts.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Bulk Import</DialogTitle>
          </DialogHeader>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full aspect-video items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
          >
            <div className="text-center">
              {uploading ? (
                <>
                  <Loader2 className="mx-auto h-10 w-10 mb-2 animate-spin" />
                  <span className="text-sm font-medium">Uploading photos…</span>
                </>
              ) : (
                <>
                  <Images className="mx-auto h-10 w-10 mb-2" />
                  <span className="text-sm font-medium">Select photos from camera roll</span>
                  <span className="block text-xs text-muted-foreground mt-1">Pick multiple at once</span>
                </>
              )}
            </div>
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  // Phase 2: Step through each photo
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center justify-between">
            <span>
              {currentIdx + 1} / {drafts.length}
            </span>
            <button onClick={removeDraft} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
              Remove this photo
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo preview */}
          <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border">
            <img src={draft.photo} alt="Preview" className="h-full w-full object-cover" />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="bulk-name">Meal Name</Label>
            <Input
              id="bulk-name"
              placeholder="e.g., Pasta Carbonara"
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              autoFocus
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
            <div className="space-y-2 mt-2">
              {draft.ingredients.map((ing) => (
                <div key={ing.id} className="rounded-lg bg-muted/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{ing.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Always have</span>
                        <Switch checked={ing.alwaysHave} onCheckedChange={() => toggleAlwaysHave(ing.id)} />
                      </div>
                      <button onClick={() => removeIngredient(ing.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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

          {/* Navigation */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => { setCurrentIdx((i) => i - 1); setNewIngredient(""); }}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            {currentIdx < drafts.length - 1 ? (
              <Button
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => { setCurrentIdx((i) => i + 1); setNewIngredient(""); }}
                disabled={!draft.name.trim()}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 rounded-xl"
                onClick={handleSaveAll}
                disabled={!canSave}
              >
                Save All ({drafts.length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
