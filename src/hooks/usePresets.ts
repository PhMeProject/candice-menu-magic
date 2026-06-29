import { useState, useEffect, useCallback, useRef } from "react";
import type { MealPreset } from "@/types/meal";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "mealplanner_presets";

function loadLocal(): MealPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(presets: MealPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn("localStorage quota exceeded", e);
  }
}

function rowToPreset(row: any): MealPreset {
  return {
    id: row.id,
    name: row.name,
    mealIds: Array.isArray(row.meal_ids) ? row.meal_ids : [],
    createdAt: new Date(row.created_at).getTime(),
  };
}

function presetToRow(p: MealPreset) {
  return {
    id: p.id,
    name: p.name,
    meal_ids: p.mealIds as unknown as any,
  };
}

export function usePresets() {
  const [presets, setPresets] = useState<MealPreset[]>(loadLocal);
  const syncedRef = useRef(false);

  useEffect(() => {
    saveLocal(presets);
  }, [presets]);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("meal_presets")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const cloudPresets = (data ?? []).map(rowToPreset);
        const local = loadLocal();
        const cloudIds = new Set(cloudPresets.map((p) => p.id));
        const missing = local.filter((p) => !cloudIds.has(p.id));
        if (missing.length > 0) {
          await supabase
            .from("meal_presets")
            .upsert(missing.map(presetToRow), { onConflict: "id", ignoreDuplicates: true });
        }
        if (cloudPresets.length > 0) {
          const merged = [
            ...cloudPresets,
            ...local.filter((p) => !cloudIds.has(p.id)),
          ];
          setPresets(merged);
        }
      } catch (e) {
        console.warn("Preset cloud sync unavailable, using local data", e);
      }
    })();
  }, []);

  const addPreset = useCallback((preset: MealPreset) => {
    setPresets((prev) => [preset, ...prev]);
    supabase
      .from("meal_presets")
      .insert(presetToRow(preset))
      .then(({ error }) => {
        if (error) console.warn("Cloud preset insert failed", error);
      });
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    supabase
      .from("meal_presets")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("Cloud preset delete failed", error);
      });
  }, []);

  return { presets, addPreset, deletePreset };
}
