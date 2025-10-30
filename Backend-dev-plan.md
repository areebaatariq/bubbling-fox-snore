# Backend Development Plan: MealPlanr

### 1️⃣ Executive Summary
- This document outlines the backend development plan for **MealPlanr**, a personalized meal planning application.
- The backend will be built using **FastAPI (Python 3.13, async)** and will connect to a **MongoDB Atlas** database using the **Motor** driver and **Pydantic v2** models.
- Development will follow a set of strict constraints: **no Docker**, **per-task manual testing** via the frontend, and a **single-branch Git workflow (`main`)**.
- The plan is broken down into a dynamic number of sprints (S0-S3) to cover all frontend-visible features, from initial setup to full functionality.

### 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
  - User authentication (Signup, Login, Logout).
  - User profile setup and management (dietary restrictions, budget).
  - Weekly meal plan generation based on user profile.
  - Ability to swap or remove individual meals from the plan.
  - Dynamic shopping list generation based on the meal plan.
  - Ability to add, remove, and check off items from the shopping list.
- **Success Criteria:**
  - All frontend features are fully functional and connected to the live backend.
  - All task-level manual tests pass successfully through UI interactions.
  - Each sprint's code is committed and pushed to the `main` branch after successful verification.

### 3️⃣ API Design
- **Base Path:** `/api/v1`
- **Error Envelope:** `{ "error": "message" }`

---
- **Authentication**
  - `POST /api/v1/auth/signup`
    - **Purpose:** Register a new user.
    - **Request:** `{ "email": "user@example.com", "password": "password123" }`
    - **Response:** `{ "token": "jwt_token" }`
    - **Validation:** Email must be valid and unique. Password must be at least 8 characters.
  - `POST /api/v1/auth/login`
    - **Purpose:** Log in an existing user.
    - **Request:** `{ "email": "user@example.com", "password": "password123" }`
    - **Response:** `{ "token": "jwt_token" }`
  - `GET /api/v1/auth/me`
    - **Purpose:** Get the current authenticated user's profile.
    - **Request:** (Requires JWT in Authorization header)
    - **Response:** `{ "id": "...", "email": "...", "profile": { ... } }`

- **User Profile**
  - `PUT /api/v1/profile`
    - **Purpose:** Create or update the user's profile.
    - **Request:** `{ "weeklyBudget": 75, "dietaryRestrictions": ["vegetarian"], "otherDietaryRestrictions": "No soy" }`
    - **Response:** `{ "weeklyBudget": 75, "dietaryRestrictions": ["vegetarian"], "otherDietaryRestrictions": "No soy" }`
    - **Validation:** `weeklyBudget` must be a positive number.

- **Meal Plan**
  - `POST /api/v1/meal-plan/generate`
    - **Purpose:** Generate a new weekly meal plan.
    - **Request:** (Requires JWT)
    - **Response:** `{ "week": "...", "meals": [...], "shoppingList": [...] }`
  - `GET /api/v1/meal-plan`
    - **Purpose:** Get the user's current meal plan.
    - **Request:** (Requires JWT)
    - **Response:** `{ "week": "...", "meals": [...], "shoppingList": [...] }`
  - `POST /api/v1/meal-plan/swap`
    - **Purpose:** Swap a meal in the current plan.
    - **Request:** `{ "day": "Monday", "mealType": "breakfast" }`
    - **Response:** `{ "week": "...", "meals": [...], "shoppingList": [...] }`
  - `POST /api/v1/meal-plan/remove`
    - **Purpose:** Remove a meal from the current plan.
    - **Request:** `{ "day": "Monday", "mealType": "breakfast" }`
    - **Response:** `{ "week": "...", "meals": [...], "shoppingList": [...] }`

- **Shopping List**
  - `POST /api/v1/shopping-list/item`
    - **Purpose:** Add a custom item to the shopping list.
    - **Request:** `{ "item": "Olive Oil", "quantity": "1 bottle" }`
    - **Response:** `{ "id": "...", "item": "Olive Oil", ... }`
  - `DELETE /api/v1/shopping-list/item/{item_id}`
    - **Purpose:** Remove an item from the shopping list.
    - **Request:** (No body)
    - **Response:** `204 No Content`
  - `PATCH /api/v1/shopping-list/item/{item_id}`
    - **Purpose:** Toggle the 'checked' status of a shopping list item.
    - **Request:** `{ "checked": true }`
    - **Response:** `{ "id": "...", "checked": true, ... }`

### 4️⃣ Data Model (MongoDB Atlas)
- **Collection: `users`**
  - `_id`: ObjectId (Primary Key)
  - `email`: String (required, unique)
  - `password`: String (required, hashed)
  - `profile`: Embedded Document
    - `weeklyBudget`: Number (default: 50)
    - `dietaryRestrictions`: Array[String] (default: [])
    - `otherDietaryRestrictions`: String (default: "")
  - **Example:**
    ```json
    {
      "_id": "ObjectId('...')",
      "email": "test@example.com",
      "password": "hashed_password_string",
      "profile": {
        "weeklyBudget": 100,
        "dietaryRestrictions": ["vegetarian", "gluten-free"],
        "otherDietaryRestrictions": "Allergic to shellfish"
      }
    }
    ```

- **Collection: `meals`** (For meal generation logic)
  - `_id`: ObjectId
  - `name`: String (required)
  - `portionSize`: String (required)
  - `ingredients`: Array[Embedded Document]
    - `item`: String
    - `quantity`: String
  - `dietaryTags`: Array[String] (e.g., "vegetarian", "gluten-free")
  - **Example:**
    ```json
    {
      "_id": "ObjectId('...')",
      "name": "Avocado Toast",
      "portionSize": "2 slices",
      "ingredients": [{"item": "Bread", "quantity": "2 slices"}, {"item": "Avocado", "quantity": "1"}],
      "dietaryTags": ["vegetarian", "vegan"]
    }
    ```

- **Collection: `meal_plans`**
  - `_id`: ObjectId
  - `userId`: ObjectId (reference to `users`)
  - `week`: String (e.g., "2025-W44")
  - `meals`: Array[Embedded Document]
    - `day`: String
    - `breakfast`: ObjectId (reference to `meals`)
    - `lunch`: ObjectId (reference to `meals`)
    - `dinner`: ObjectId (reference to `meals`)
  - `shoppingList`: Array[Embedded Document]
    - `id`: String (UUID)
    - `item`: String
    - `quantity`: String
    - `store`: String
    - `price`: Number
    - `checked`: Boolean
  - **Example:**
    ```json
    {
      "_id": "ObjectId('...')",
      "userId": "ObjectId('...')",
      "week": "2025-W44",
      "meals": [{"day": "Monday", "breakfast": "ObjectId('...')", ...}],
      "shoppingList": [{"id": "uuid-123", "item": "Milk", "quantity": "1 gallon", "checked": false, ...}]
    }
    ```

### 5️⃣ Frontend Audit & Feature Map
- **Component: `UserProfileSetup.tsx`**
  - **Purpose:** Onboard new users by collecting budget and dietary needs.
  - **Endpoint:** `PUT /api/v1/profile`
  - **Model:** `users.profile`
  - **Auth:** Required.
- **Component: `MealPlanGenerator.tsx`**
  - **Purpose:** Generate, display, and manage the weekly meal plan and shopping list.
  - **Endpoints:**
    - `POST /api/v1/meal-plan/generate`
    - `GET /api/v1/meal-plan`
    - `POST /api/v1/meal-plan/swap`
    - `POST /api/v1/meal-plan/remove`
    - `POST /api/v1/shopping-list/item`
    - `DELETE /api/v1/shopping-list/item/{item_id}`
    - `PATCH /api/v1/shopping-list/item/{item_id}`
  - **Model:** `meal_plans`
  - **Auth:** Required.

### 6️⃣ Configuration & ENV Vars (core only)
- `APP_ENV`: `development` or `production`
- `PORT`: `8000`
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret key for signing JWTs.
- `JWT_EXPIRES_IN`: `3600` (1 hour in seconds)
- `CORS_ORIGINS`: Frontend URL (e.g., `http://localhost:5173`)

### 9️⃣ Testing Strategy (Manual via Frontend)
- All backend functionality will be validated exclusively through the frontend UI.
- Every task includes a **Manual Test Step** and a **User Test Prompt**.
- After all tasks in a sprint are completed and tested, the code will be committed and pushed to the `main` branch.
- If any test fails, the issue must be fixed and re-tested before pushing.

### 🔟 Dynamic Sprint Plan & Backlog (S0 → S3)

---
### S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create a FastAPI skeleton with `/api/v1` base path and a `/healthz` endpoint.
- Connect to MongoDB Atlas using the `MONGODB_URI` from env vars.
- Implement the `/healthz` endpoint to perform a DB ping and return a JSON status.
- Enable CORS to allow requests from the frontend URL.
- Replace dummy API URLs in the frontend with the real backend URLs.
- Initialize a single Git repository at the project root, set the default branch to `main`, and push to GitHub.
- Create a single `.gitignore` file at the root to ignore `__pycache__`, `.env`, `*.pyc`, etc.

**Definition of Done:**
- The backend runs locally and successfully connects to the MongoDB Atlas instance.
- Hitting `/healthz` returns a success status including DB connectivity.
- The frontend application can make requests to the backend without CORS errors.
- The initial project structure is pushed to the `main` branch on GitHub.

**Manual Test Step:**
- Run the backend server. Open the browser's developer tools on the frontend, go to the Network tab, and verify that a request to `/healthz` returns a 200 OK status with a JSON body indicating a successful DB connection.

**User Test Prompt:**
> "Start the backend server and refresh the frontend application. Confirm that the network tab shows a successful call to the `/healthz` endpoint."

---
### S1 – Basic Auth & User Profile

**Objectives:**
- Implement JWT-based user signup and login.
- Protect the user profile and meal plan endpoints.
- Allow users to create and update their profile (budget, dietary restrictions).

**User Stories:**
- As a new user, I want to sign up for an account with my email and password.
- As a registered user, I want to log in to access my meal plans.
- As a logged-in user, I want to set up my profile with my budget and dietary needs.

**Tasks:**
- **Task 1.1: Implement User Model and Signup**
  - Create the `users` collection model with Pydantic.
  - Implement the `POST /api/v1/auth/signup` endpoint, hashing passwords using Argon2.
  - **Manual Test Step:** Use the frontend UI to create a new account. Check the database to confirm the user was created with a hashed password.
  - **User Test Prompt:** "Create a new account using the signup form and verify you receive a success confirmation."
- **Task 1.2: Implement Login**
  - Implement the `POST /api/v1/auth/login` endpoint to verify credentials and issue a JWT.
  - **Manual Test Step:** Log in with the newly created user. Verify a JWT is stored in the browser's local storage and you are redirected to the profile setup page.
  - **User Test Prompt:** "Log in with your new account. You should be taken to the profile setup screen."
- **Task 1.3: Implement Profile CRUD**
  - Implement the `PUT /api/v1/profile` and `GET /api/v1/auth/me` endpoints.
  - **Manual Test Step:** Fill out and submit the user profile form. Refresh the page and verify the saved profile data is loaded correctly.
  - **User Test Prompt:** "Complete the user profile setup form and save it. Refresh the page to ensure your settings persist."

**Definition of Done:**
- Users can sign up, log in, and are redirected to the main dashboard.
- User profile data is successfully saved to and retrieved from the database.
- All endpoints are protected and require a valid JWT.

**Post-sprint:**
- Commit and push all changes to the `main` branch.

---
### S2 – Meal Plan Generation & Management

**Objectives:**
- Implement the core logic for generating a weekly meal plan.
- Allow users to swap and remove meals from their plan.
- Ensure the shopping list is dynamically updated when the meal plan changes.

**User Stories:**
- As a user, I want to generate a new weekly meal plan tailored to my profile.
- As a user, I want to replace a meal I don't like with a different one.
- As a user, I want to remove a meal if I plan to eat out.

**Tasks:**
- **Task 2.1: Create Meal Data**
  - Create a `meals` collection and populate it with at least 15-20 sample meals covering different dietary tags.
  - **Manual Test Step:** Manually verify the meal data in the MongoDB Atlas UI.
  - **User Test Prompt:** "Confirm with the developer that the sample meal data has been loaded into the database."
- **Task 2.2: Implement Meal Plan Generation**
  - Implement the `POST /api/v1/meal-plan/generate` endpoint. It should fetch meals matching the user's dietary profile and create a `meal_plans` document.
  - **Manual Test Step:** Click the "Generate New Weekly Plan" button. Verify the UI updates to show a full week of meals and a corresponding shopping list.
  - **User Test Prompt:** "Generate a new meal plan. The screen should populate with a 7-day schedule and a shopping list."
- **Task 2.3: Implement Meal Swapping**
  - Implement the `POST /api/v1/meal-plan/swap` endpoint.
  - **Manual Test Step:** Click the "swap" (refresh icon) button next to any meal. The meal should be replaced, and the shopping list should update accordingly.
  - **User Test Prompt:** "Swap a meal for Tuesday's lunch. A new meal should appear, and the shopping list might change."
- **Task 2.4: Implement Meal Removal**
  - Implement the `POST /api/v1/meal-plan/remove` endpoint.
  - **Manual Test Step:** Click the "remove" (trash icon) button next to any meal. The meal should disappear from the plan, and the shopping list should update.
  - **User Test Prompt:** "Remove Wednesday's dinner. The meal slot should become empty, and the shopping list should reflect the change."

**Definition of Done:**
- Users can generate a valid meal plan based on their profile.
- All meal management actions (swap, remove) work correctly and update the UI and shopping list in real-time.

**Post-sprint:**
- Commit and push all changes to the `main` branch.

---
### S3 – Shopping List Management

**Objectives:**
- Enable users to manage their shopping list independently of the meal plan.
- Allow adding custom items, removing items, and marking items as checked.

**User Stories:**
- As a user, I want to add extra items to my shopping list that aren't in my meal plan.
- As a user, I want to remove items I already have at home.
- As a user, I want to check off items as I buy them at the store.

**Tasks:**
- **Task 3.1: Add Custom Shopping Item**
  - Implement the `POST /api/v1/shopping-list/item` endpoint.
  - **Manual Test Step:** Use the "Add new item" form on the shopping list card to add an item (e.g., "Paper Towels"). Verify it appears in the list.
  - **User Test Prompt:** "Add 'Paper Towels' with quantity '1 roll' to your shopping list. It should appear at the bottom of the list."
- **Task 3.2: Remove Shopping Item**
  - Implement the `DELETE /api/v1/shopping-list/item/{item_id}` endpoint.
  - **Manual Test Step:** Click the trash icon next to any item in the shopping list. The item should be removed.
  - **User Test Prompt:** "Remove an item from your shopping list. It should disappear from the UI."
- **Task 3.3: Toggle Shopping Item Status**
  - Implement the `PATCH /api/v1/shopping-list/item/{item_id}` endpoint.
  - **Manual Test Step:** Click the checkbox next to a shopping list item. The item's text should get a line-through style. Click it again to uncheck it.
  - **User Test Prompt:** "Check off an item on your shopping list. It should be visually marked as complete. Uncheck it to revert."

**Definition of Done:**
- The shopping list is fully interactive and manageable.
- All changes are persisted to the database and reflected correctly in the UI.

**Post-sprint:**
- Commit and push all changes to the `main` branch.