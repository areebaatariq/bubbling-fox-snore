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
  id: string;
  item: string;
  quantity: string;
  store: string; // Simplified, could be store ID
  price: number; // Mock price
  checked: boolean;
}

export interface MealPlan {
  week: string; // e.g., "2023-W40"
  meals: {
    day: string; // e.g., "Monday"
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
  }[];
  shoppingList: ShoppingListItem[];
}