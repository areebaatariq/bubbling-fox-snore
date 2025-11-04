"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        // Login endpoint expects form-urlencoded data
        const formData = new URLSearchParams();
        formData.append('username', values.email);
        formData.append('password', values.password);

        const response = await axios.post(`${API_URL}/auth/login`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        login(response.data.access_token);
        toast.success("Logged in successfully!");
      } else {
        // Signup endpoint expects JSON
        await axios.post(`${API_URL}/auth/signup`, {
          email: values.email,
          password: values.password,
        });
        toast.success("Account created successfully! Please log in.");
        form.reset();
        setIsLogin(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
              </Button>
            </form>
          </Form>
          <Button 
            variant="link" 
            onClick={() => {
              setIsLogin(!isLogin);
              form.reset();
            }} 
            className="w-full mt-4"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;