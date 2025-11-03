"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Settings } from "lucide-react";
import UserProfileSetup from "@/components/UserProfileSetup";
import { UserProfile } from "@/types";
import MealPlanGenerator from "@/components/MealPlanGenerator"; // Import the new component

// Placeholder for the main application content after profile setup
const MealPlanDashboard: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to MealPlanr!</h1>
      <p className="text-lg mb-2">
        Your weekly budget: ${userProfile.weeklyBudget}
      </p>
      <p className="text-lg mb-6">
        Dietary restrictions:{" "}
        {userProfile.dietaryRestrictions.length > 0
          ? userProfile.dietaryRestrictions.join(", ")
          : "None"}
        {userProfile.otherDietaryRestrictions &&
          `, ${userProfile.otherDietaryRestrictions}`}
      </p>
      <p className="text-md text-muted-foreground mb-8">
        This is your Meal Plan Dashboard. Let's plan your meals!
      </p>

      {/* Integrate the MealPlanGenerator here */}
      <MealPlanGenerator userProfile={userProfile} />
    </div>
  );
};

const Index = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/profile");
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  if (isLoading) {
    // Display the initial loading screen while checking for profile
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-8">
          <Settings
            className="w-16 h-16 text-gray-400 animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </div>
        <h1 className="text-xl font-medium text-gray-300 text-center max-w-md">
          Loading MealPlanr...
        </h1>
      </div>
    );
  }

  // Check if profile exists and has at least dietaryRestrictions or weeklyBudget
  const hasProfile = profile && (
    (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) ||
    profile.weeklyBudget > 0
  );

  return hasProfile ? (
    <MealPlanDashboard userProfile={profile} />
  ) : (
    <UserProfileSetup onProfileComplete={handleProfileComplete} />
  );
};

export default Index;