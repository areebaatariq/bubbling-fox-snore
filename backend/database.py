import motor.motor_asyncio
from models import User, UserCreate, MealPlan, Meal
from auth import get_password_hash
import os
from datetime import datetime
import random
from bson import ObjectId

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
database = client.mealplanr
user_collection = database.get_collection("users")
meals_collection = database.get_collection("meals")
meal_plan_collection = database.get_collection("meal_plans")

async def get_user(email: str):
    user = await user_collection.find_one({"email": email})
    if user:
        return User(**user)

async def create_user(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    new_user = await user_collection.insert_one(user_dict)
    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    return User(**created_user)
from models import Profile

async def update_profile(email: str, profile: Profile):
    await user_collection.update_one(
        {"email": email}, {"$set": {"profile": profile.dict()}}
    )
    user = await get_user(email)
    return user.profile

async def generate_meal_plan(user: User):
    today = datetime.now()
    week_number = today.isocalendar()
    year = today.year
    week_str = f"{year}-W{week_number.week}"

    await meal_plan_collection.delete_many({"userId": user.id, "week": week_str})

    query = {}
    if user.profile.dietaryRestrictions:
        query["dietaryTags"] = {"$all": user.profile.dietaryRestrictions}

    meals_list = await meals_collection.find(query).to_list(length=100)

    if len(meals_list) < 3:
        return None

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    meals_in_plan = []
    shopping_list_items = {}

    for day in days:
        chosen_meals = random.sample(meals_list, 3)
        day_meals = {
            "day": day,
            "breakfast": chosen_meals['_id'],
            "lunch": chosen_meals['_id'],
            "dinner": chosen_meals['_id']
        }
        meals_in_plan.append(day_meals)

        for meal in chosen_meals:
            for ingredient in meal['ingredients']:
                item_name = ingredient['item']
                if item_name in shopping_list_items:
                    # Simple quantity aggregation, assuming same units
                    shopping_list_items[item_name]['quantity'] += f" + {ingredient['quantity']}"
                else:
                    shopping_list_items[item_name] = {
                        "item": item_name,
                        "quantity": ingredient['quantity'],
                        "checked": False
                    }
    
    shopping_list = [{"id": str(ObjectId()), **v} for k, v in shopping_list_items.items()]

    new_meal_plan_doc = {
        "userId": user.id,
        "week": week_str,
        "meals": meals_in_plan,
        "shoppingList": shopping_list
    }

    result = await meal_plan_collection.insert_one(new_meal_plan_doc)
    created_plan = await meal_plan_collection.find_one({"_id": result.inserted_id})

    return await get_meal_plan(user)

async def get_meal_plan(user: User):
    today = datetime.now()
    week_number = today.isocalendar()
    year = today.year
    week_str = f"{year}-W{week_number.week}"
    
    plan_doc = await meal_plan_collection.find_one({"userId": user.id, "week": week_str})

    if not plan_doc:
        return None

    for day_meal in plan_doc["meals"]:
        if day_meal.get("breakfast"):
            day_meal["breakfast"] = await meals_collection.find_one({"_id": day_meal["breakfast"]})
        if day_meal.get("lunch"):
            day_meal["lunch"] = await meals_collection.find_one({"_id": day_meal["lunch"]})
        if day_meal.get("dinner"):
            day_meal["dinner"] = await meals_collection.find_one({"_id": day_meal["dinner"]})
            
    return plan_doc

async def swap_meal(user: User, day: str, meal_type: str):
    plan = await get_meal_plan(user)
    if not plan:
        return None

    query = {}
    if user.profile.dietaryRestrictions:
        query["dietaryTags"] = {"$all": user.profile.dietaryRestrictions}
    
    current_meal_ids = []
    for meal_day in plan['meals']:
        if meal_day.get('breakfast'): current_meal_ids.append(meal_day['breakfast']['_id'])
        if meal_day.get('lunch'): current_meal_ids.append(meal_day['lunch']['_id'])
        if meal_day.get('dinner'): current_meal_ids.append(meal_day['dinner']['_id'])

    query["_id"] = {"$nin": current_meal_ids}
    
    new_meal = await meals_collection.find_one(query)
    if not new_meal:
        return None # No other meals available to swap

    # Update meal in plan
    for meal_day in plan['meals']:
        if meal_day['day'] == day:
            meal_day[meal_type] = new_meal
            break
    
    # Recalculate shopping list
    shopping_list_items = {}
    for meal_day in plan['meals']:
        for meal_slot in ['breakfast', 'lunch', 'dinner']:
            meal = meal_day.get(meal_slot)
            if meal:
                for ingredient in meal['ingredients']:
                    item_name = ingredient['item']
                    if item_name in shopping_list_items:
                        shopping_list_items[item_name]['quantity'] += f" + {ingredient['quantity']}"
                    else:
                        shopping_list_items[item_name] = {
                            "item": item_name,
                            "quantity": ingredient['quantity'],
                            "checked": False
                        }
    
    shopping_list = [{"id": str(ObjectId()), **v} for k, v in shopping_list_items.items()]
    
    # Update database
    await meal_plan_collection.update_one(
        {"_id": plan["_id"]},
        {
            "$set": {
                f"meals.$[elem].{meal_type}": new_meal['_id'],
                "shoppingList": shopping_list
            }
        },
        array_filters=[{"elem.day": day}]
    )

    return await get_meal_plan(user)

async def remove_meal(user: User, day: str, meal_type: str):
    plan = await get_meal_plan(user)
    if not plan:
        return None

    # Update meal in plan
    for meal_day in plan['meals']:
        if meal_day['day'] == day:
            meal_day[meal_type] = None
            break
    
    # Recalculate shopping list
    shopping_list_items = {}
    for meal_day in plan['meals']:
        for meal_slot in ['breakfast', 'lunch', 'dinner']:
            meal = meal_day.get(meal_slot)
            if meal:
                for ingredient in meal['ingredients']:
                    item_name = ingredient['item']
                    if item_name in shopping_list_items:
                        shopping_list_items[item_name]['quantity'] += f" + {ingredient['quantity']}"
                    else:
                        shopping_list_items[item_name] = {
                            "item": item_name,
                            "quantity": ingredient['quantity'],
                            "checked": False
                        }
    
    shopping_list = [{"id": str(ObjectId()), **v} for k, v in shopping_list_items.items()]

    # Update database
    await meal_plan_collection.update_one(
        {"_id": plan["_id"]},
        {
            "$set": {
                f"meals.$[elem].{meal_type}": None,
                "shoppingList": shopping_list
            }
        },
        array_filters=[{"elem.day": day}]
    )

    return await get_meal_plan(user)
from models import ShoppingListItem, ShoppingListItemCreate

async def add_shopping_list_item(user: User, item: ShoppingListItemCreate):
    today = datetime.now()
    week_number = today.isocalendar()
    year = today.year
    week_str = f"{year}-W{week_number.week}"
    
    new_item = ShoppingListItem(**item.dict())
    
    result = await meal_plan_collection.update_one(
        {"userId": user.id, "week": week_str},
        {"$push": {"shoppingList": new_item.dict()}}
    )
    
    if result.modified_count == 1:
        return new_item
    return None

async def remove_shopping_list_item(user: User, item_id: str):
    today = datetime.now()
    week_number = today.isocalendar()
    year = today.year
    week_str = f"{year}-W{week_number.week}"

    result = await meal_plan_collection.update_one(
        {"userId": user.id, "week": week_str},
        {"$pull": {"shoppingList": {"id": item_id}}}
    )
    
    return result.modified_count == 1

async def update_shopping_list_item(user: User, item_id: str, checked: bool):
    today = datetime.now()
    week_number = today.isocalendar()
    year = today.year
    week_str = f"{year}-W{week_number.week}"

    result = await meal_plan_collection.update_one(
        {"userId": user.id, "week": week_str, "shoppingList.id": item_id},
        {"$set": {"shoppingList.$.checked": checked}}
    )

    if result.modified_count == 1:
        plan = await get_meal_plan(user)
        for item in plan['shoppingList']:
            if item['id'] == item_id:
                return item
    return None