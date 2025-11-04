"use client";

import React, { useState, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfileSetup from "@/components/UserProfileSetup";
import Auth from "@/components/Auth";
import { UserProfile } from "@/types";
import MealPlanGenerator from "@/components/MealPlanGenerator";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/utils/api";

// Placeholder for the main application content after profile setup
const MealPlanDashboard: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background text-foreground p-4">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Welcome to MealPlanr!</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      <div className="w-full max-w-6xl mb-6">
        <p className="text-lg mb-2">
          Your weekly budget: ${userProfile.weeklyBudget}
        </p>
        <p className="text-lg mb-2">
          Dietary restrictions:{" "}
          {userProfile.dietaryRestrictions.length > 0
            ? userProfile.dietaryRestrictions.join(", ")
            : "None"}
          {userProfile.otherDietaryRestrictions &&
            `, ${userProfile.otherDietaryRestrictions}`}
        </p>
      </div>

      {/* Integrate the MealPlanGenerator here */}
      <MealPlanGenerator userProfile={userProfile} />
    </div>
  );
};

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/profile");
        console.log("Profile fetched:", response.data);
        setProfile(response.data);
      } catch (error: any) {
        console.error("Failed to fetch profile:", error);
        // If 401, the interceptor will handle it
        if (error.response?.status !== 401) {
          // For other errors, set empty profile
          setProfile(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  // Show loading while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="mb-8">
          <Settings
            className="w-16 h-16 text-muted-foreground animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </div>
        <h1 className="text-xl font-medium text-foreground text-center max-w-md">
          Loading MealPlanr...
        </h1>
      </div>
    );
  }

  // Show auth if not authenticated
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Check if profile exists and has at least dietaryRestrictions or weeklyBudget
  // A profile is considered "complete" if it has dietary restrictions OR a weekly budget > 0
  const hasProfile = profile && (
    (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) ||
    (profile.weeklyBudget && profile.weeklyBudget > 0)
  );
  
  console.log("Profile state:", { profile, hasProfile, weeklyBudget: profile?.weeklyBudget });

  return hasProfile ? (
    <MealPlanDashboard userProfile={profile} />
  ) : (
    <UserProfileSetup onProfileComplete={handleProfileComplete} />
  );
};

export default Index;