from pydantic import BaseModel, Field, EmailStr
import uuid
from typing import List, Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class Profile(BaseModel):
    weeklyBudget: int = 50
    dietaryRestrictions: List[str] = []
    otherDietaryRestrictions: str = ""

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    password: str
    profile: Profile = Field(default_factory=Profile)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Ingredient(BaseModel):
    item: str
    quantity: str

class Meal(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    portionSize: str
    ingredients: List[Ingredient]
    dietaryTags: List[str]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MealSwapRequest(BaseModel):
    day: str
    mealType: str

class MealRemoveRequest(BaseModel):
    day: str
    mealType: str

class MealInPlan(BaseModel):
    day: str
    breakfast: Optional[PyObjectId] = None
    lunch: Optional[PyObjectId] = None
    dinner: Optional[PyObjectId] = None

class ShoppingListItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item: str
    quantity: str
    store: Optional[str] = None
    price: Optional[float] = None
    checked: bool = False

class ShoppingListItemCreate(BaseModel):
    item: str
    quantity: str

class ShoppingListItemUpdate(BaseModel):
    checked: bool

class MealPlan(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    userId: PyObjectId
    week: str
    meals: List[MealInPlan]
    shoppingList: List[ShoppingListItem] = []

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}