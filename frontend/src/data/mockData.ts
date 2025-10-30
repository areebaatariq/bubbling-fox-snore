import { Meal, ShoppingListItem } from "@/types";

export const mockMeals: Meal[] = [
  {
    id: "meal1",
    name: "Vegetable Stir-fry with Tofu",
    recipe: "Quick and healthy stir-fry with seasonal vegetables and crispy tofu.",
    ingredients: [
      { item: "Tofu", quantity: "1 block" },
      { item: "Broccoli", quantity: "1 head" },
      { item: "Carrots", quantity: "2 medium" },
      { item: "Bell Pepper", quantity: "1 large" },
      { item: "Soy Sauce", quantity: "2 tbsp" },
      { item: "Ginger", quantity: "1 tsp grated" },
      { item: "Rice", quantity: "1 cup" },
    ],
    portionSize: 2,
  },
  {
    id: "meal2",
    name: "Lentil Soup",
    recipe: "Hearty and warming lentil soup, perfect for a cold day.",
    ingredients: [
      { item: "Brown Lentils", quantity: "1 cup" },
      { item: "Vegetable Broth", quantity: "4 cups" },
      { item: "Onion", quantity: "1 medium" },
      { item: "Celery", quantity: "2 stalks" },
      { item: "Carrots", quantity: "2 medium" },
      { item: "Diced Tomatoes", quantity: "1 can" },
      { item: "Spinach", quantity: "2 cups" },
    ],
    portionSize: 4,
  },
  {
    id: "meal3",
    name: "Chicken and Veggie Skewers",
    recipe: "Grilled chicken and colorful vegetables on skewers.",
    ingredients: [
      { item: "Chicken Breast", quantity: "2" },
      { item: "Zucchini", quantity: "1" },
      { item: "Cherry Tomatoes", quantity: "1 cup" },
      { item: "Bell Pepper", quantity: "1" },
      { item: "Onion", quantity: "1" },
      { item: "Olive Oil", quantity: "2 tbsp" },
      { item: "Paprika", quantity: "1 tsp" },
    ],
    portionSize: 2,
  },
  {
    id: "meal4",
    name: "Pasta Primavera",
    recipe: "Light and fresh pasta with spring vegetables.",
    ingredients: [
      { item: "Pasta", quantity: "200g" },
      { item: "Asparagus", quantity: "1 bunch" },
      { item: "Peas", quantity: "1 cup" },
      { item: "Cherry Tomatoes", quantity: "1 cup" },
      { item: "Garlic", quantity: "2 cloves" },
      { item: "Parmesan Cheese", quantity: "1/4 cup" },
      { item: "Lemon", quantity: "1/2" },
    ],
    portionSize: 3,
  },
  {
    id: "meal5",
    name: "Salmon with Roasted Asparagus",
    recipe: "Simple and elegant baked salmon with roasted asparagus.",
    ingredients: [
      { item: "Salmon Fillets", quantity: "2" },
      { item: "Asparagus", quantity: "1 bunch" },
      { item: "Olive Oil", quantity: "1 tbsp" },
      { item: "Lemon", quantity: "1/2" },
      { item: "Dill", quantity: "1 tsp" },
    ],
    portionSize: 2,
  },
  {
    id: "meal6",
    name: "Black Bean Burgers",
    recipe: "Homemade black bean burgers served on buns with toppings.",
    ingredients: [
      { item: "Black Beans", quantity: "1 can" },
      { item: "Breadcrumbs", quantity: "1/2 cup" },
      { item: "Egg", quantity: "1" },
      { item: "Onion", quantity: "1/2" },
      { item: "Garlic", quantity: "1 clove" },
      { item: "Cumin", quantity: "1 tsp" },
      { item: "Burger Buns", quantity: "2" },
    ],
    portionSize: 2,
  },
  {
    id: "meal7",
    name: "Quinoa Salad with Roasted Vegetables",
    recipe: "A nutritious and colorful salad with quinoa and roasted veggies.",
    ingredients: [
      { item: "Quinoa", quantity: "1 cup" },
      { item: "Bell Peppers", quantity: "2" },
      { item: "Zucchini", quantity: "1" },
      { item: "Red Onion", quantity: "1/2" },
      { item: "Feta Cheese", quantity: "1/4 cup" },
      { item: "Lemon Vinaigrette", quantity: "2 tbsp" },
    ],
    portionSize: 3,
  },
];

export const mockShoppingListItems: ShoppingListItem[] = [
  { id: "s1", item: "Milk", quantity: "1 gallon", store: "Local Grocer", price: 3.50, checked: false },
  { id: "s2", item: "Eggs", quantity: "1 dozen", store: "Local Grocer", price: 2.80, checked: false },
  { id: "s3", item: "Bread", quantity: "1 loaf", store: "Local Grocer", price: 2.20, checked: false },
  { id: "s4", item: "Apples", quantity: "3 lbs", store: "Local Grocer", price: 4.00, checked: false },
  { id: "s5", item: "Chicken Breast", quantity: "2 lbs", store: "Local Grocer", price: 8.99, checked: false },
  { id: "s6", item: "Spinach", quantity: "1 bag", store: "Local Grocer", price: 2.50, checked: false },
];

export const getFilteredMeals = (dietaryRestrictions: string[]): Meal[] => {
  let filtered = [...mockMeals];

  if (dietaryRestrictions.includes("vegetarian") || dietaryRestrictions.includes("vegan")) {
    filtered = filtered.filter(meal =>
      !meal.ingredients.some(ingredient =>
        ["chicken", "salmon", "egg", "feta cheese", "parmesan cheese"].includes(ingredient.item.toLowerCase())
      )
    );
  }
  if (dietaryRestrictions.includes("vegan")) {
    filtered = filtered.filter(meal =>
      !meal.ingredients.some(ingredient =>
        ["milk", "egg", "feta cheese", "parmesan cheese"].includes(ingredient.item.toLowerCase())
      )
    );
  }
  if (dietaryRestrictions.includes("gluten-free")) {
    filtered = filtered.filter(meal =>
      !meal.ingredients.some(ingredient =>
        ["pasta", "breadcrumbs", "burger buns"].includes(ingredient.item.toLowerCase())
      )
    );
  }
  if (dietaryRestrictions.includes("dairy-free")) {
    filtered = filtered.filter(meal =>
      !meal.ingredients.some(ingredient =>
        ["milk", "feta cheese", "parmesan cheese"].includes(ingredient.item.toLowerCase())
      )
    );
  }
  if (dietaryRestrictions.includes("nut-allergy")) {
    // No nut-containing meals in mock data, but would filter here
  }
  if (dietaryRestrictions.includes("pescatarian")) {
    filtered = filtered.filter(meal =>
      !meal.ingredients.some(ingredient =>
        ["chicken", "egg"].includes(ingredient.item.toLowerCase())
      )
    );
  }

  return filtered;
};