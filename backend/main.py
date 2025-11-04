import os
from fastapi import FastAPI, HTTPException, Depends, status, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import json
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
import random

load_dotenv()

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Get the directory where this file is located
BASE_DIR = Path(__file__).parent
MEALS_JSON_PATH = BASE_DIR.parent / "meals.json"
USERS_JSON_PATH = BASE_DIR / "users.json"

# --- Data Loading ---
def load_meals():
    # Try multiple paths for meals.json (local dev vs Render deployment)
    possible_paths = [
        MEALS_JSON_PATH,  # Parent directory (for local dev)
        BASE_DIR / "meals.json",  # Current directory (for Render after copy)
        Path("meals.json"),  # Current working directory
    ]
    
    for meals_path in possible_paths:
        try:
            with open(meals_path, "r") as f:
                meals_data = json.load(f)
            print(f"Successfully loaded meals.json from {meals_path}")
            
            # Convert meals format to match expected structure
            formatted_meals = []
            for meal in meals_data:
                # Convert ingredients from {item, quantity} to {name, quantity, unit}
                formatted_ingredients = []
                for ing in meal.get("ingredients", []):
                    # Split quantity string into number and unit if possible
                    qty_str = ing.get("quantity", "")
                    # Try to parse quantity and unit
                    parts = qty_str.split(maxsplit=1)
                    if len(parts) == 2:
                        try:
                            qty = float(parts[0])
                            unit = parts[1]
                        except ValueError:
                            qty = 1
                            unit = qty_str
                    else:
                        qty = 1
                        unit = qty_str
                    
                    formatted_ingredients.append({
                        "name": ing.get("item", ""),
                        "quantity": qty,
                        "unit": unit
                    })
                
                formatted_meals.append({
                    "id": meal.get("id", ""),
                    "name": meal.get("name", ""),
                    "recipe": meal.get("recipe", ""),
                    "ingredients": formatted_ingredients,
                    "portionSize": meal.get("portionSize", 2)
                })
            
            # Return formatted meals after processing all meals
            return formatted_meals
        except FileNotFoundError:
            continue  # Try next path
        except json.JSONDecodeError as e:
            print(f"Error decoding meals.json at {meals_path}: {e}")
            continue  # Try next path
    
    # If all paths failed
    print(f"meals.json not found in any of these locations: {possible_paths}")
    return []

meals_data = load_meals()

# --- JSON-based User Storage ---
def load_users():
    try:
        if USERS_JSON_PATH.exists():
            with open(USERS_JSON_PATH, "r") as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Error loading users.json: {e}")
        return {}

def save_users(users):
    try:
        with open(USERS_JSON_PATH, "w") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Error saving users.json: {e}")

users_db = load_users()

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Pydantic Models ---
class UserBase(BaseModel):
    email: EmailStr
    
class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(UserBase):
    model_config = {"from_attributes": True}

class UserProfile(BaseModel):
    dietary_preferences: Optional[list[str]] = None
    allergies: Optional[list[str]] = None
    health_goals: Optional[list[str]] = None
    other_dietary_restrictions: Optional[str] = None
    weekly_budget: Optional[float] = None

class TokenData(BaseModel):
    email: Optional[str] = None

class Meal(BaseModel):
    id: str
    name: str
    recipe: str
    ingredients: list[dict]
    portionSize: int

class MealPlan(BaseModel):
    meals: list[Meal]

class ShoppingListItem(BaseModel):
    name: str
    quantity: str
    completed: bool = False

class ShoppingList(BaseModel):
    items: list[ShoppingListItem]

# --- FastAPI App ---
app = FastAPI()

# Custom middleware to handle OPTIONS requests explicitly
class OptionsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            response = Response(status_code=200)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
        response = await call_next(request)
        return response

# Add custom OPTIONS middleware first
app.add_middleware(OptionsMiddleware)

# CORS configuration - must be before route definitions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for CORS preflight
    allow_credentials=False,  # Set to False when using "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly include all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Note: FastAPI's CORSMiddleware should handle OPTIONS automatically
# Explicit handlers are added as fallback to ensure compatibility

# --- Dependency ---
# No authentication required - use default session
def get_default_user():
    # Use a default session ID for storing data
    return {"email": "default@session.local"}

# --- API Endpoints ---
@app.post("/api/v1/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    users_db[user.email] = {"email": user.email, "hashed_password": hashed_password}
    save_users(users_db)
    return {"message": "User created successfully"}

@app.post("/api/v1/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/healthz")
def check_health():
    try:
        # Check if meals.json is loaded
        if not meals_data:
            raise HTTPException(status_code=500, detail="meals.json not loaded")
        return {"status": "ok", "message": "Successfully loaded meals.json"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@app.get("/api/v1/auth/me")
async def read_users_me():
    return {"email": "default@session.local"}

# Explicit OPTIONS handler for profile endpoint (more specific, defined first)
@app.options("/api/v1/profile")
async def options_profile(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "3600"
    response.status_code = 200
    return {}

# Catch-all OPTIONS handler for any path (less specific, defined after)
@app.options("/{full_path:path}")
async def options_handler(full_path: str, response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "3600"
    response.status_code = 200
    return {}

@app.put("/api/v1/profile")
async def update_profile(profile: UserProfile, response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    user = get_default_user()
    user_email = user["email"]
    if user_email not in users_db:
        users_db[user_email] = {}
    if "profile" not in users_db[user_email]:
        users_db[user_email]["profile"] = {}
    users_db[user_email]["profile"].update(profile.dict(exclude_unset=True))
    save_users(users_db)
    # Return the updated profile in frontend format
    profile_data = users_db[user_email].get("profile", {})
    return {
        "dietaryRestrictions": profile_data.get("dietary_preferences", []),
        "otherDietaryRestrictions": profile_data.get("other_dietary_restrictions", ""),
        "weeklyBudget": profile_data.get("weekly_budget", 50)
    }

@app.get("/api/v1/profile")
async def get_profile():
    user = get_default_user()
    user_email = user["email"]
    profile_data = users_db.get(user_email, {}).get("profile", {})
    # Return in frontend format
    return {
        "dietaryRestrictions": profile_data.get("dietary_preferences", []),
        "otherDietaryRestrictions": profile_data.get("other_dietary_restrictions", ""),
        "weeklyBudget": profile_data.get("weekly_budget", 50)
    }

@app.post("/api/v1/meal-plan/generate")
async def generate_meal_plan():
    # Generate a weekly meal plan (7 days)
    user = get_default_user()
    user_email = user["email"]
    if user_email not in users_db:
        users_db[user_email] = {}
    user_profile = users_db.get(user_email, {}).get("profile", {})
    dietary_prefs = user_profile.get("dietary_preferences", [])
    
    # Filter meals based on dietary preferences
    available_meals = meals_data.copy()
    if "vegetarian" in dietary_prefs or "vegan" in dietary_prefs:
        available_meals = [m for m in available_meals if not any(
            ing["name"].lower() in ["chicken", "salmon", "chicken breast", "salmon fillets"] 
            for ing in m["ingredients"]
        )]
    if "vegan" in dietary_prefs:
        available_meals = [m for m in available_meals if not any(
            ing["name"].lower() in ["egg", "feta cheese", "parmesan cheese", "milk"] 
            for ing in m["ingredients"]
        )]
    if "gluten-free" in dietary_prefs:
        available_meals = [m for m in available_meals if not any(
            ing["name"].lower() in ["pasta", "breadcrumbs", "burger buns"] 
            for ing in m["ingredients"]
        )]
    if "dairy-free" in dietary_prefs:
        available_meals = [m for m in available_meals if not any(
            ing["name"].lower() in ["milk", "feta cheese", "parmesan cheese"] 
            for ing in m["ingredients"]
        )]
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    meal_types = ["breakfast", "lunch", "dinner"]
    
    # Generate weekly plan
    weekly_plan = []
    for day in days:
        day_plan = {"day": day}
        for meal_type in meal_types:
            if available_meals:
                selected_meal = random.choice(available_meals)
                day_plan[meal_type] = Meal(**selected_meal).dict()
        weekly_plan.append(day_plan)
    
    # Store the generated meal plan
    users_db[user_email]["meal_plan"] = weekly_plan
    save_users(users_db)

    # Generate and store the shopping list
    shopping_list_items = []
    ingredients_map = {}
    for day_plan in weekly_plan:
        for meal_type in meal_types:
            if meal_type in day_plan:
                meal_data = day_plan[meal_type]
                for ingredient in meal_data.get("ingredients", []):
                    ing_name = ingredient["name"].lower()
                    if ing_name in ingredients_map:
                        # Simple aggregation - in real app would handle unit conversion
                        ingredients_map[ing_name]["quantity"] += ingredient.get("quantity", 1)
                    else:
                        ingredients_map[ing_name] = {
                            "name": ingredient["name"],
                            "quantity": ingredient.get("quantity", 1),
                            "unit": ingredient.get("unit", "")
                        }
    
    for ing in ingredients_map.values():
        shopping_list_items.append(
            ShoppingListItem(
                name=ing["name"],
                quantity=f'{ing["quantity"]} {ing["unit"]}'.strip(),
            )
        )
    
    users_db[user_email]["shopping_list"] = [
        item.dict() for item in shopping_list_items
    ]
    save_users(users_db)
    
    return {"meals": weekly_plan}

@app.get("/api/v1/meal-plan")
async def get_meal_plan():
    user = get_default_user()
    user_email = user["email"]
    meal_plan_data = users_db.get(user_email, {}).get("meal_plan", [])
    return {"meals": meal_plan_data}

@app.put("/api/v1/meal-plan")
async def update_meal_plan(meal_plan: dict):
    user = get_default_user()
    user_email = user["email"]
    if user_email not in users_db:
        users_db[user_email] = {}
    users_db[user_email]["meal_plan"] = meal_plan.get("meals", [])
    save_users(users_db)
    # Recalculate shopping list
    shopping_list_items = []
    ingredients_map = {}
    for day_plan in meal_plan.get("meals", []):
        for meal_type in ["breakfast", "lunch", "dinner"]:
            if meal_type in day_plan and day_plan[meal_type]:
                meal_data = day_plan[meal_type]
                for ingredient in meal_data.get("ingredients", []):
                    ing_name = ingredient.get("name", "").lower()
                    if ing_name in ingredients_map:
                        ingredients_map[ing_name]["quantity"] += ingredient.get("quantity", 1)
                    else:
                        ingredients_map[ing_name] = {
                            "name": ingredient.get("name", ""),
                            "quantity": ingredient.get("quantity", 1),
                            "unit": ingredient.get("unit", "")
                        }
    
    for ing in ingredients_map.values():
        shopping_list_items.append(
            ShoppingListItem(
                name=ing["name"],
                quantity=f'{ing["quantity"]} {ing["unit"]}'.strip(),
            ).dict()
        )
    
    users_db[user_email]["shopping_list"] = shopping_list_items
    save_users(users_db)
    return {"message": "Meal plan updated successfully"}

@app.get("/api/v1/shopping-list")
async def get_shopping_list():
    user = get_default_user()
    user_email = user["email"]
    shopping_list_data = users_db.get(user_email, {}).get("shopping_list", [])
    return {"items": shopping_list_data}

@app.put("/api/v1/shopping-list")
async def update_shopping_list(shopping_list: dict):
    user = get_default_user()
    user_email = user["email"]
    if user_email not in users_db:
        users_db[user_email] = {}
    users_db[user_email]["shopping_list"] = shopping_list.get("items", [])
    save_users(users_db)
    return {"message": "Shopping list updated successfully"}

# For local development - Render uses uvicorn directly
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)