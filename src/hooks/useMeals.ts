import { useState, useEffect, useCallback, useRef } from "react";
import type { Meal } from "@/types/meal";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "mealplanner_meals";

function loadLocal(): Meal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(meals: Meal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  } catch (e) {
    console.warn("localStorage quota exceeded, data may not persist", e);
  }
}

function rowToMeal(row: any): Meal {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo ?? "",
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    createdAt: Number(row.created_at_ms) || Date.now(),
  };
}

function mealToRow(m: Meal) {
  return {
    id: m.id,
    name: m.name,
    photo: m.photo ?? "",
    ingredients: m.ingredients as unknown as any,
    created_at_ms: m.createdAt,
  };
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>(loadLocal);
  const syncedRef = useRef(false);

  // Persist locally as a fallback layer.
  useEffect(() => {
    saveLocal(meals);
  }, [meals]);

  // One-time initial sync with cloud
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("meals")
          .select("*")
          .order("created_at_ms", { ascending: false });
        if (error) throw error;
        const cloudMeals = (data ?? []).map(rowToMeal);
        const local = loadLocal();

        if (cloudMeals.length === 0 && local.length > 0) {
          // One-time migration: push local data to cloud.
          const { error: insertErr } = await supabase
            .from("meals")
            .insert(local.map(mealToRow));
          if (insertErr) console.warn("Initial meal migration failed", insertErr);
        } else if (cloudMeals.length > 0) {
          setMeals(cloudMeals);
        }
      } catch (e) {
        console.warn("Cloud sync unavailable, using local data", e);
      }
    })();
  }, []);

  const addMeal = useCallback((meal: Meal) => {
    setMeals((prev) => [meal, ...prev]);
    supabase
      .from("meals")
      .insert(mealToRow(meal))
      .then(({ error }) => {
        if (error) console.warn("Cloud insert failed", error);
      });
  }, []);

  const updateMeal = useCallback((updated: Meal) => {
    setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    supabase
      .from("meals")
      .update(mealToRow(updated))
      .eq("id", updated.id)
      .then(({ error }) => {
        if (error) console.warn("Cloud update failed", error);
      });
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    supabase
      .from("meals")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("Cloud delete failed", error);
      });
  }, []);

  return { meals, addMeal, updateMeal, deleteMeal };
}
