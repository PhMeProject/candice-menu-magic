import { useState, useEffect, useCallback, useRef } from "react";
import type { PlannedMeal } from "@/types/meal";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "mealplanner_plan";

function loadLocal(): PlannedMeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(plan: PlannedMeal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch (e) {
    console.warn("localStorage quota exceeded for plan", e);
  }
}

export function usePlan() {
  const [plan, setPlan] = useState<PlannedMeal[]>(loadLocal);
  const syncedRef = useRef(false);

  useEffect(() => {
    saveLocal(plan);
  }, [plan]);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("plan_entries")
          .select("meal_id, servings");
        if (error) throw error;
        const cloudPlan: PlannedMeal[] = (data ?? []).map((r: any) => ({
          mealId: r.meal_id,
          servings: r.servings,
        }));
        const local = loadLocal();

        if (cloudPlan.length === 0 && local.length > 0) {
          // One-time migration of plan entries — only insert entries whose
          // meal already exists in the cloud (FK constraint), retry safely.
          const { error: insertErr } = await supabase
            .from("plan_entries")
            .insert(
              local.map((p) => ({ meal_id: p.mealId, servings: p.servings }))
            );
          if (insertErr) console.warn("Initial plan migration failed", insertErr);
        } else if (cloudPlan.length > 0) {
          setPlan(cloudPlan);
        }
      } catch (e) {
        console.warn("Plan cloud sync unavailable, using local", e);
      }
    })();
  }, []);

  const toggleMeal = useCallback((mealId: string) => {
    let willAdd = false;
    setPlan((prev) => {
      const exists = prev.find((p) => p.mealId === mealId);
      if (exists) {
        willAdd = false;
        return prev.filter((p) => p.mealId !== mealId);
      }
      willAdd = true;
      return [...prev, { mealId, servings: 1 }];
    });
    if (willAdd) {
      supabase
        .from("plan_entries")
        .insert({ meal_id: mealId, servings: 1 })
        .then(({ error }) => {
          if (error) console.warn("Plan insert failed", error);
        });
    } else {
      supabase
        .from("plan_entries")
        .delete()
        .eq("meal_id", mealId)
        .then(({ error }) => {
          if (error) console.warn("Plan delete failed", error);
        });
    }
  }, []);

  const setServings = useCallback((mealId: string, servings: number) => {
    const clamped = Math.max(1, Math.min(10, servings));
    setPlan((prev) =>
      prev.map((p) => (p.mealId === mealId ? { ...p, servings: clamped } : p))
    );
    supabase
      .from("plan_entries")
      .update({ servings: clamped })
      .eq("meal_id", mealId)
      .then(({ error }) => {
        if (error) console.warn("Plan servings update failed", error);
      });
  }, []);

  const clearPlan = useCallback(() => {
    setPlan([]);
    supabase
      .from("plan_entries")
      .delete()
      .gte("servings", 0)
      .then(({ error }) => {
        if (error) console.warn("Plan clear failed", error);
      });
  }, []);

  const removeMeal = useCallback((mealId: string) => {
    setPlan((prev) => prev.filter((p) => p.mealId !== mealId));
    supabase
      .from("plan_entries")
      .delete()
      .eq("meal_id", mealId)
      .then(({ error }) => {
        if (error) console.warn("Plan remove failed", error);
      });
  }, []);

  return { plan, toggleMeal, setServings, clearPlan, removeMeal };
}
