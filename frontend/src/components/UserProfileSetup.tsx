"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { UserProfile } from "@/types";
import { toast } from "sonner";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "nut-allergy", label: "Nut Allergy" },
  { id: "pescatarian", label: "Pescatarian" },
];

const formSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  otherDietaryRestrictions: z.string().optional(),
  weeklyBudget: z.coerce
    .number()
    .min(1, { message: "Budget must be at least $1" })
    .max(1000, { message: "Budget cannot exceed $1000" }),
});

interface UserProfileSetupProps {
  onProfileComplete: (profile: UserProfile) => void;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({
  onProfileComplete,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietaryRestrictions: [],
      otherDietaryRestrictions: "",
      weeklyBudget: 50, // Default budget
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted with values:", values);
    const profile: UserProfile = {
      dietaryRestrictions: values.dietaryRestrictions || [],
      otherDietaryRestrictions: values.otherDietaryRestrictions || "",
      weeklyBudget: values.weeklyBudget,
    };
    localStorage.setItem("userProfile", JSON.stringify(profile));
    onProfileComplete(profile);
    toast.success("Profile saved successfully!");
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        Set Up Your MealPlanr Profile
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="dietaryRestrictions"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">
                    Dietary Restrictions & Preferences
                  </FormLabel>
                  <FormDescription>
                    Select any dietary needs or preferences you have.
                  </FormDescription>
                </div>
                {dietaryOptions.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="dietaryRestrictions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="otherDietaryRestrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other Restrictions/Allergies</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 'Allergic to peanuts, dislike cilantro'"
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Specify any other dietary needs or allergies not listed above.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weeklyBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekly Grocery Budget ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 75"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? "" : value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Set your target weekly spending for groceries.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Save Profile
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UserProfileSetup;