export interface UserProfile {
  dietaryRestrictions: string[];
  otherDietaryRestrictions: string;
  weeklyBudget: number;
}

export interface Meal {
  id: string;
  name: string;
  recipe: string; // Simplified for MVP, could be more detailed
  ingredients: { item: string; quantity: string }[];
  portionSize: number;
}

export interface ShoppingListItem {
  name: string;
  quantity: string;
  price?: number;
  completed: boolean;
}

export interface DayPlan {
  day: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
}

export interface MealPlan {
  meals: DayPlan[];
}