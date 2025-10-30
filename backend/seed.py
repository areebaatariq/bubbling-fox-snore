import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_DETAILS = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.mealplanr
meals_collection = database.get_collection("meals")

meals = [
    {
        "_id": ObjectId(),
        "name": "Avocado Toast",
        "portionSize": "2 slices",
        "ingredients": [{"item": "Bread", "quantity": "2 slices"}, {"item": "Avocado", "quantity": "1"}],
        "dietaryTags": ["vegetarian", "vegan"]
    },
    {
        "_id": ObjectId(),
        "name": "Grilled Chicken Salad",
        "portionSize": "1 bowl",
        "ingredients": [
            {"item": "Chicken Breast", "quantity": "1"},
            {"item": "Lettuce", "quantity": "1 head"},
            {"item": "Tomato", "quantity": "1"},
            {"item": "Cucumber", "quantity": "1/2"}
        ],
        "dietaryTags": ["gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Spaghetti Bolognese",
        "portionSize": "1 plate",
        "ingredients": [
            {"item": "Spaghetti", "quantity": "100g"},
            {"item": "Ground Beef", "quantity": "150g"},
            {"item": "Tomato Sauce", "quantity": "200g"}
        ],
        "dietaryTags": []
    },
    {
        "_id": ObjectId(),
        "name": "Lentil Soup",
        "portionSize": "1 bowl",
        "ingredients": [
            {"item": "Lentils", "quantity": "1 cup"},
            {"item": "Carrots", "quantity": "2"},
            {"item": "Celery", "quantity": "2 stalks"}
        ],
        "dietaryTags": ["vegetarian", "vegan", "gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Salmon with Roasted Vegetables",
        "portionSize": "1 fillet",
        "ingredients": [
            {"item": "Salmon Fillet", "quantity": "1"},
            {"item": "Broccoli", "quantity": "1 head"},
            {"item": "Asparagus", "quantity": "1 bunch"}
        ],
        "dietaryTags": ["gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Pancakes",
        "portionSize": "3 pancakes",
        "ingredients": [
            {"item": "Flour", "quantity": "1 cup"},
            {"item": "Milk", "quantity": "1 cup"},
            {"item": "Egg", "quantity": "1"}
        ],
        "dietaryTags": ["vegetarian"]
    },
    {
        "_id": ObjectId(),
        "name": "Oatmeal with Berries",
        "portionSize": "1 bowl",
        "ingredients": [
            {"item": "Oats", "quantity": "1/2 cup"},
            {"item": "Mixed Berries", "quantity": "1 cup"},
            {"item": "Almond Milk", "quantity": "1 cup"}
        ],
        "dietaryTags": ["vegetarian", "vegan", "gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Chicken Stir-fry",
        "portionSize": "1 plate",
        "ingredients": [
            {"item": "Chicken Breast", "quantity": "1"},
            {"item": "Broccoli", "quantity": "1 head"},
            {"item": "Soy Sauce", "quantity": "2 tbsp"}
        ],
        "dietaryTags": []
    },
    {
        "_id": ObjectId(),
        "name": "Tofu Scramble",
        "portionSize": "1 plate",
        "ingredients": [
            {"item": "Tofu", "quantity": "1 block"},
            {"item": "Turmeric", "quantity": "1 tsp"},
            {"item": "Spinach", "quantity": "1 cup"}
        ],
        "dietaryTags": ["vegetarian", "vegan"]
    },
    {
        "_id": ObjectId(),
        "name": "Beef Tacos",
        "portionSize": "3 tacos",
        "ingredients": [
            {"item": "Ground Beef", "quantity": "150g"},
            {"item": "Taco Shells", "quantity": "3"},
            {"item": "Cheese", "quantity": "1/2 cup"}
        ],
        "dietaryTags": []
    },
    {
        "_id": ObjectId(),
        "name": "Quinoa Salad",
        "portionSize": "1 bowl",
        "ingredients": [
            {"item": "Quinoa", "quantity": "1 cup"},
            {"item": "Cucumber", "quantity": "1/2"},
            {"item": "Bell Pepper", "quantity": "1"}
        ],
        "dietaryTags": ["vegetarian", "vegan", "gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Mushroom Risotto",
        "portionSize": "1 plate",
        "ingredients": [
            {"item": "Arborio Rice", "quantity": "1 cup"},
            {"item": "Mushrooms", "quantity": "1 cup"},
            {"item": "Parmesan Cheese", "quantity": "1/2 cup"}
        ],
        "dietaryTags": ["vegetarian"]
    },
    {
        "_id": ObjectId(),
        "name": "Fruit Smoothie",
        "portionSize": "1 glass",
        "ingredients": [
            {"item": "Banana", "quantity": "1"},
            {"item": "Mixed Berries", "quantity": "1 cup"},
            {"item": "Yogurt", "quantity": "1/2 cup"}
        ],
        "dietaryTags": ["vegetarian", "gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Egg Muffins",
        "portionSize": "3 muffins",
        "ingredients": [
            {"item": "Eggs", "quantity": "6"},
            {"item": "Spinach", "quantity": "1 cup"},
            {"item": "Feta Cheese", "quantity": "1/2 cup"}
        ],
        "dietaryTags": ["vegetarian", "gluten-free"]
    },
    {
        "_id": ObjectId(),
        "name": "Black Bean Burgers",
        "portionSize": "2 burgers",
        "ingredients": [
            {"item": "Black Beans", "quantity": "1 can"},
            {"item": "Breadcrumbs", "quantity": "1/2 cup"},
            {"item": "Onion", "quantity": "1/2"}
        ],
        "dietaryTags": ["vegetarian", "vegan"]
    }
]

async def seed_data():
    await meals_collection.delete_many({})
    await meals_collection.insert_many(meals)
    print("Data seeded successfully")

if __name__ == "__main__":
    asyncio.run(seed_data())