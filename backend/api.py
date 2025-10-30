from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import database
import models
import auth
from datetime import timedelta

router = APIRouter()

@router.post("/auth/signup", response_model=models.Token)
async def signup(user: models.UserCreate):
    db_user = await database.get_user(user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    new_user = await database.create_user(user)
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/login", response_model=models.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await database.get_user(form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/profile", response_model=models.Profile)
async def update_profile(
    profile: models.Profile, current_user: models.User = Depends(auth.get_current_user)
):
    return await database.update_profile(current_user.email, profile)

@router.get("/auth/me", response_model=models.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.post("/meal-plan/generate", response_model=models.MealPlan)
async def generate_meal_plan(current_user: models.User = Depends(auth.get_current_user)):
    meal_plan = await database.generate_meal_plan(current_user)
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate meal plan, not enough meals matching criteria.",
        )
    return meal_plan

@router.get("/meal-plan", response_model=models.MealPlan)
async def get_meal_plan(current_user: models.User = Depends(auth.get_current_user)):
    meal_plan = await database.get_meal_plan(current_user)
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No meal plan found for the current week.",
        )
    return meal_plan

@router.post("/meal-plan/swap", response_model=models.MealPlan)
async def swap_meal(
    swap_request: models.MealSwapRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    updated_plan = await database.swap_meal(
        current_user, swap_request.day, swap_request.mealType
    )
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not swap meal. Meal plan not found or no alternative meals available.",
        )
    return updated_plan

@router.post("/meal-plan/remove", response_model=models.MealPlan)
async def remove_meal(
    remove_request: models.MealRemoveRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    updated_plan = await database.remove_meal(
        current_user, remove_request.day, remove_request.mealType
    )
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not remove meal. Meal plan not found.",
        )
    return updated_plan

@router.post("/shopping-list/item", response_model=models.ShoppingListItem)
async def add_shopping_list_item(
    item: models.ShoppingListItemCreate,
    current_user: models.User = Depends(auth.get_current_user),
):
    new_item = await database.add_shopping_list_item(current_user, item)
    if not new_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not add item. Meal plan not found.",
        )
    return new_item

@router.delete("/shopping-list/item/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_shopping_list_item(
    item_id: str, current_user: models.User = Depends(auth.get_current_user)
):
    success = await database.remove_shopping_list_item(current_user, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not remove item. Meal plan or item not found.",
        )
    return

@router.patch("/shopping-list/item/{item_id}", response_model=models.ShoppingListItem)
async def update_shopping_list_item(
    item_id: str,
    item: models.ShoppingListItemUpdate,
    current_user: models.User = Depends(auth.get_current_user),
):
    updated_item = await database.update_shopping_list_item(
        current_user, item_id, item.checked
    )
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not update item. Meal plan or item not found.",
        )
    return updated_item