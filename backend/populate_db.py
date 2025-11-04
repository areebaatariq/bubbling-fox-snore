import json

# It's beneficial to structure the mock data within the script for clarity and maintainability.
mock_meals = [
  {
    "id": "meal1",
    "name": "Vegetable Stir-fry with Tofu",
    "recipe": "Quick and healthy stir-fry with seasonal vegetables and crispy tofu.",
    "ingredients": [
      { "item": "Tofu", "quantity": "1 block" },
      { "item": "Broccoli", "quantity": "1 head" },
      { "item": "Carrots", "quantity": "2 medium" },
      { "item": "Bell Pepper", "quantity": "1 large" },
      { "item": "Soy Sauce", "quantity": "2 tbsp" },
      { "item": "Ginger", "quantity": "1 tsp grated" },
      { "item": "Rice", "quantity": "1 cup" },
    ],
    "portionSize": 2,
  },
  {
    "id": "meal2",
    "name": "Lentil Soup",
    "recipe": "Hearty and warming lentil soup, perfect for a cold day.",
    "ingredients": [
      { "item": "Brown Lentils", "quantity": "1 cup" },
      { "item": "Vegetable Broth", "quantity": "4 cups" },
      { "item": "Onion", "quantity": "1 medium" },
      { "item": "Celery", "quantity": "2 stalks" },
      { "item": "Carrots", "quantity": "2 medium" },
      { "item": "Diced Tomatoes", "quantity": "1 can" },
      { "item": "Spinach", "quantity": "2 cups" },
    ],
    "portionSize": 4,
  },
  {
    "id": "meal3",
    "name": "Chicken and Veggie Skewers",
    "recipe": "Grilled chicken and colorful vegetables on skewers.",
    "ingredients": [
      { "item": "Chicken Breast", "quantity": "2" },
      { "item": "Zucchini", "quantity": "1" },
      { "item": "Cherry Tomatoes", "quantity": "1 cup" },
      { "item": "Bell Pepper", "quantity": "1" },
      { "item": "Onion", "quantity": "1" },
      { "item": "Olive Oil", "quantity": "2 tbsp" },
      { "item": "Paprika", "quantity": "1 tsp" },
    ],
    "portionSize": 2,
  },
  {
    "id": "meal4",
    "name": "Pasta Primavera",
    "recipe": "Light and fresh pasta with spring vegetables.",
    "ingredients": [
      { "item": "Pasta", "quantity": "200g" },
      { "item": "Asparagus", "quantity": "1 bunch" },
      { "item": "Peas", "quantity": "1 cup" },
      { "item": "Cherry Tomatoes", "quantity": "1 cup" },
      { "item": "Garlic", "quantity": "2 cloves" },
      { "item": "Parmesan Cheese", "quantity": "1/4 cup" },
      { "item": "Lemon", "quantity": "1/2" },
    ],
    "portionSize": 3,
  },
  {
    "id": "meal5",
    "name": "Salmon with Roasted Asparagus",
    "recipe": "Simple and elegant baked salmon with roasted asparagus.",
    "ingredients": [
      { "item": "Salmon Fillets", "quantity": "2" },
      { "item": "Asparagus", "quantity": "1 bunch" },
      { "item": "Olive Oil", "quantity": "1 tbsp" },
      { "item": "Lemon", "quantity": "1/2" },
      { "item": "Dill", "quantity": "1 tsp" },
    ],
    "portionSize": 2,
  },
  {
    "id": "meal6",
    "name": "Black Bean Burgers",
    "recipe": "Homemade black bean burgers served on buns with toppings.",
    "ingredients": [
      { "item": "Black Beans", "quantity": "1 can" },
      { "item": "Breadcrumbs", "quantity": "1/2 cup" },
      { "item": "Egg", "quantity": "1" },
      { "item": "Onion", "quantity": "1/2" },
      { "item": "Garlic", "quantity": "1 clove" },
      { "item": "Cumin", "quantity": "1 tsp" },
      { "item": "Burger Buns", "quantity": "2" },
    ],
    "portionSize": 2,
  },
  {
    "id": "meal7",
    "name": "Quinoa Salad with Roasted Vegetables",
    "recipe": "A nutritious and colorful salad with quinoa and roasted veggies.",
    "ingredients": [
      { "item": "Quinoa", "quantity": "1 cup" },
      { "item": "Bell Peppers", "quantity": "2" },
      { "item": "Zucchini", "quantity": "1" },
      { "item": "Red Onion", "quantity": "1/2" },
      { "item": "Feta Cheese", "quantity": "1/4 cup" },
      { "item": "Lemon Vinaigrette", "quantity": "2 tbsp" },
    ],
    "portionSize": 3,
  },
]

def create_json_file():
    """
    Creates a JSON file with a predefined list of meal documents.
    """
    try:
        with open("meals.json", "w") as f:
            json.dump(mock_meals, f, indent=2)
        print("Successfully created meals.json")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    create_json_file()