import { useState, useEffect, useCallback } from "react";
import type { PlannedMeal } from "@/types/meal";

const STORAGE_KEY = "mealplanner_plan";

function loadPlan(): PlannedMeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function usePlan() {
  const [plan, setPlan] = useState<PlannedMeal[]>(loadPlan);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch (e) {
      console.warn("localStorage quota exceeded for plan", e);
    }
  }, [plan]);

  const toggleMeal = useCallback((mealId: string) => {
    setPlan((prev) => {
      const exists = prev.find((p) => p.mealId === mealId);
      if (exists) return prev.filter((p) => p.mealId !== mealId);
      return [...prev, { mealId, servings: 1 }];
    });
  }, []);

  const setServings = useCallback((mealId: string, servings: number) => {
    setPlan((prev) =>
      prev.map((p) => (p.mealId === mealId ? { ...p, servings: Math.max(1, Math.min(10, servings)) } : p))
    );
  }, []);

  const clearPlan = useCallback(() => setPlan([]), []);

  const removeMeal = useCallback((mealId: string) => {
    setPlan((prev) => prev.filter((p) => p.mealId !== mealId));
  }, []);

  return { plan, toggleMeal, setServings, clearPlan, removeMeal };
}
