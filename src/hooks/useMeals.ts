import { useState, useEffect, useCallback } from "react";
import type { Meal } from "@/types/meal";

const STORAGE_KEY = "mealplanner_meals";

function loadMeals(): Meal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>(loadMeals);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  }, [meals]);

  const addMeal = useCallback((meal: Meal) => {
    setMeals((prev) => [meal, ...prev]);
  }, []);

  const updateMeal = useCallback((updated: Meal) => {
    setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { meals, addMeal, updateMeal, deleteMeal };
}
