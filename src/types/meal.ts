export interface Ingredient {
  id: string;
  name: string;
  alwaysHave: boolean;
  substitute?: string;
}

export interface Meal {
  id: string;
  name: string;
  photo: string; // base64 data URL
  ingredients: Ingredient[];
  createdAt: number;
}

export interface PlannedMeal {
  mealId: string;
  servings: number;
}
