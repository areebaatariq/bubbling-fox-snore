"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, Meal, ShoppingListItem, MealPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MinusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mockMeals, mockShoppingListItems, getFilteredMeals } from "@/data/mockData";
import { v4 as uuidv4 } from 'uuid';

interface MealPlanGeneratorProps {
  userProfile: UserProfile;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MealPlanGenerator: React.FC<MealPlanGeneratorProps> = ({ userProfile }) => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [newShoppingQuantity, setNewShoppingQuantity] = useState("");

  useEffect(() => {
    fetch("https://snapdev-demo-backend.onrender.com/api/v1/healthz")
      .then((response) => response.json())
      .then((data) => console.log("Health check:", data))
      .catch((error) => console.error("Health check failed:", error));

    const storedMealPlan = localStorage.getItem("mealPlan");
    const storedShoppingList = localStorage.getItem("shoppingList");
    if (storedMealPlan && storedShoppingList) {
      setMealPlan(JSON.parse(storedMealPlan));
      setShoppingList(JSON.parse(storedShoppingList));
    }
  }, []);

  useEffect(() => {
    if (mealPlan) {
      localStorage.setItem("mealPlan", JSON.stringify(mealPlan));
    }
    if (shoppingList) {
      localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
    }
  }, [mealPlan, shoppingList]);

  const generateMealPlan = () => {
    const availableMeals = getFilteredMeals(userProfile.dietaryRestrictions);
    if (availableMeals.length === 0) {
      toast.error("No meals found matching your dietary restrictions. Please adjust your profile.");
      return;
    }

    const newMeals: MealPlan["meals"] = daysOfWeek.map((day) => {
      const breakfast = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      const lunch = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      const dinner = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      return { day, breakfast, lunch, dinner };
    });

    const generatedShoppingList = generateShoppingListFromMeals(newMeals);

    setMealPlan({
      week: "Current Week", // Simplified for MVP
      meals: newMeals,
      shoppingList: generatedShoppingList, // This will be updated by the separate shopping list state
    });
    setShoppingList(generatedShoppingList);
    toast.success("Weekly meal plan generated!");
  };

  const generateShoppingListFromMeals = (meals: MealPlan["meals"]): ShoppingListItem[] => {
    const list: { [key: string]: { item: string; quantity: string; price: number; store: string } } = {};

    meals.forEach(dayPlan => {
      [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].forEach(meal => {
        if (meal) {
          meal.ingredients.forEach(ingredient => {
            const key = ingredient.item.toLowerCase();
            if (!list[key]) {
              list[key] = {
                item: ingredient.item,
                quantity: ingredient.quantity,
                price: parseFloat((Math.random() * 5 + 1).toFixed(2)), // Mock price
                store: "Local Grocer", // Simplified
              };
            } else {
              // For MVP, just keep the first quantity, or you could try to sum them
              // For now, we'll just ensure the item is on the list
            }
          });
        }
      });
    });

    return Object.values(list).map(item => ({
      id: uuidv4(),
      item: item.item,
      quantity: item.quantity,
      store: item.store,
      price: item.price,
      checked: false,
    }));
  };

  const handleSwapMeal = (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!mealPlan) return;
    const availableMeals = getFilteredMeals(userProfile.dietaryRestrictions);
    if (availableMeals.length === 0) {
      toast.error("No alternative meals found matching your dietary restrictions.");
      return;
    }
    const newMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
    const updatedMeals = mealPlan.meals.map((d) =>
      d.day === day ? { ...d, [mealType]: newMeal } : d
    );
    setMealPlan({ ...mealPlan, meals: updatedMeals });
    setShoppingList(generateShoppingListFromMeals(updatedMeals)); // Regenerate shopping list
    toast.info(`Swapped ${mealType} for ${day}.`);
  };

  const handleRemoveMeal = (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!mealPlan) return;
    const updatedMeals = mealPlan.meals.map((d) =>
      d.day === day ? { ...d, [mealType]: undefined } : d
    );
    setMealPlan({ ...mealPlan, meals: updatedMeals });
    setShoppingList(generateShoppingListFromMeals(updatedMeals)); // Regenerate shopping list
    toast.info(`Removed ${mealType} for ${day}.`);
  };

  const handleAddShoppingItem = () => {
    if (newShoppingItem.trim() === "" || newShoppingQuantity.trim() === "") {
      toast.error("Please enter both item and quantity.");
      return;
    }
    const newItem: ShoppingListItem = {
      id: uuidv4(),
      item: newShoppingItem.trim(),
      quantity: newShoppingQuantity.trim(),
      store: "Local Grocer", // Default store for manually added items
      price: parseFloat((Math.random() * 5 + 1).toFixed(2)), // Mock price
      checked: false,
    };
    setShoppingList((prev) => [...prev, newItem]);
    setNewShoppingItem("");
    setNewShoppingQuantity("");
    toast.success("Item added to shopping list.");
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from shopping list.");
  };

  const handleToggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <div className="container mx-auto p-8 space-y-8 bg-card rounded-xl shadow-xl max-w-6xl">
      <h2 className="text-3xl font-bold text-center mb-8">Your Meal Plan</h2>

      <div className="flex justify-center">
        <Button onClick={generateMealPlan} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Generate New Weekly Plan
        </Button>
      </div>

      {mealPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meal Plan Display */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Weekly Meal Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mealPlan.meals.map((dayPlan) => (
                <div key={dayPlan.day} className="border-b pb-4 last:border-b-0">
                  <h3 className="text-xl font-semibold mb-2">{dayPlan.day}</h3>
                  <div className="space-y-2">
                    {["breakfast", "lunch", "dinner"].map((mealType) => {
                      const meal = dayPlan[mealType as keyof typeof dayPlan] as Meal | undefined;
                      return (
                        <div key={mealType} className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium capitalize">{mealType}:</p>
                            <p className="text-base">{meal?.name || "No meal planned"}</p>
                            {meal && (
                              <p className="text-xs text-muted-foreground">Portions: {meal.portionSize}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSwapMeal(dayPlan.day, mealType as "breakfast" | "lunch" | "dinner")}
                              disabled={!meal}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveMeal(dayPlan.day, mealType as "breakfast" | "lunch" | "dinner")}
                              disabled={!meal}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shopping List Display */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Add new item"
                  value={newShoppingItem}
                  onChange={(e) => setNewShoppingItem(e.target.value)}
                />
                <Input
                  placeholder="Quantity"
                  value={newShoppingQuantity}
                  onChange={(e) => setNewShoppingQuantity(e.target.value)}
                  className="w-24"
                />
                <Button onClick={handleAddShoppingItem} size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              {shoppingList.length > 0 ? (
                <ul className="space-y-2">
                  {shoppingList.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between bg-muted/50 p-3 rounded-md"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.checked}
                          onCheckedChange={() => handleToggleShoppingItem(item.id)}
                        />
                        <Label
                          htmlFor={`item-${item.id}`}
                          className={`flex-1 text-left ${item.checked ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.item} ({item.quantity}) - ${item.price.toFixed(2)} ({item.store})
                        </Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveShoppingItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">Your shopping list is empty.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          Click "Generate New Weekly Plan" to get started!
        </p>
      )}
    </div>
  );
};

export default MealPlanGenerator;