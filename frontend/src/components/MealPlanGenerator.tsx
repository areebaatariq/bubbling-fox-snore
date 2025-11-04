"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, Meal, ShoppingListItem, MealPlan, DayPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MinusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/utils/api";

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
    fetchMealPlan();
    fetchShoppingList();
  }, []);

  const fetchMealPlan = async () => {
    try {
      const response = await apiClient.get("/meal-plan");
      setMealPlan(response.data);
    } catch (error) {
      console.error("Failed to fetch meal plan:", error);
      toast.error("Failed to fetch meal plan.");
    }
  };

  const fetchShoppingList = async () => {
    try {
      const response = await apiClient.get("/shopping-list");
      setShoppingList(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch shopping list:", error);
      toast.error("Failed to fetch shopping list.");
    }
  };

  const generateMealPlan = async () => {
    try {
      const response = await apiClient.post("/meal-plan/generate");
      const data = response.data;
      setMealPlan(data);
      const newShoppingList = generateShoppingList(data);
      setShoppingList(newShoppingList);
      updateShoppingListOnBackend(newShoppingList);
      toast.success("Weekly meal plan generated!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "An error occurred while generating the meal plan.");
    }
  };



  const generateShoppingList = (plan: MealPlan): ShoppingListItem[] => {
    const ingredientsMap: { [key: string]: { quantity: number; unit: string; name: string } } = {};
  
    plan.meals.forEach((dayPlan) => {
      ["breakfast", "lunch", "dinner"].forEach((mealType) => {
        const meal = dayPlan[mealType as keyof DayPlan] as Meal | undefined;
        if (meal && meal.ingredients) {
          meal.ingredients.forEach((ingredient: any) => {
            // Handle both formats: {item, quantity} and {name, quantity, unit}
            const ingName = ingredient.name || ingredient.item || "";
            const ingQty = ingredient.quantity || "1";
            const ingUnit = ingredient.unit || "";
            
            const key = ingName.toLowerCase();
            if (ingredientsMap[key]) {
              // Simple aggregation - assumes units are the same
              const qty = typeof ingQty === 'number' ? ingQty : parseFloat(ingQty) || 1;
              ingredientsMap[key].quantity += qty;
            } else {
              const qty = typeof ingQty === 'number' ? ingQty : parseFloat(ingQty) || 1;
              ingredientsMap[key] = {
                name: ingName,
                quantity: qty,
                unit: ingUnit || "",
              };
            }
          });
        }
      });
    });
  
    return Object.keys(ingredientsMap).map((key) => ({
      name: ingredientsMap[key].name,
      quantity: ingredientsMap[key].unit 
        ? `${ingredientsMap[key].quantity} ${ingredientsMap[key].unit}`.trim()
        : `${ingredientsMap[key].quantity}`,
      completed: false,
    }));
  };

  const recalculateShoppingList = (updatedPlan: MealPlan) => {
    const newShoppingList = generateShoppingList(updatedPlan);
    setShoppingList(newShoppingList);
    updateShoppingListOnBackend(newShoppingList);
  };

  const handleSwapMeal = async (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!mealPlan) return;
    
    // For now, regenerate the whole plan - in production, you'd fetch a single meal
    await generateMealPlan();
    toast.info(`Swapped ${mealType} for ${day}.`);
  };

  const handleRemoveMeal = async (day: string, mealType: "breakfast" | "lunch" | "dinner") => {
    if (!mealPlan) return;
    const updatedMeals = mealPlan.meals.map((d) =>
      d.day === day ? { ...d, [mealType]: undefined } : d
    );
    const updatedPlan = { ...mealPlan, meals: updatedMeals };
    setMealPlan(updatedPlan);
    recalculateShoppingList(updatedPlan);
    
    try {
      await apiClient.put("/meal-plan", updatedPlan);
      toast.info(`Removed ${mealType} for ${day}.`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update meal plan.");
      // Optionally revert state changes
    }
  };

  const updateShoppingListOnBackend = async (updatedList: ShoppingListItem[]) => {
    try {
      await apiClient.put("/shopping-list", { items: updatedList });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update shopping list.");
    }
  };

  const handleAddShoppingItem = () => {
    if (newShoppingItem.trim() === "" || newShoppingQuantity.trim() === "") {
      toast.error("Please enter both item and quantity.");
      return;
    }
    const newItem: ShoppingListItem = {
      name: newShoppingItem.trim(),
      quantity: newShoppingQuantity.trim(),
      completed: false,
    };
    const updatedList = [...shoppingList, newItem];
    setShoppingList(updatedList);
    updateShoppingListOnBackend(updatedList);
    setNewShoppingItem("");
    setNewShoppingQuantity("");
    toast.success("Item added to shopping list.");
  };

  const handleRemoveShoppingItem = (itemName: string) => {
    const updatedList = shoppingList.filter((item) => item.name !== itemName);
    setShoppingList(updatedList);
    updateShoppingListOnBackend(updatedList);
    toast.info("Item removed from shopping list.");
  };

  const handleToggleShoppingItem = (itemName: string) => {
    const updatedList = shoppingList.map((item) =>
      item.name === itemName ? { ...item, completed: !item.completed } : item
    );
    setShoppingList(updatedList);
    updateShoppingListOnBackend(updatedList);
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
                      key={item.name}
                      className="flex items-center justify-between bg-muted/50 p-3 rounded-md"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={`item-${item.name}`}
                          checked={item.completed}
                          onCheckedChange={() => handleToggleShoppingItem(item.name)}
                        />
                        <Label
                          htmlFor={`item-${item.name}`}
                          className={`flex-1 text-left ${item.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.name} ({item.quantity})
                        </Label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveShoppingItem(item.name)}
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