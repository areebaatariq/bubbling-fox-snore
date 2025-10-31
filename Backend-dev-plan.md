# Backend Development Plan: MealPlanr

### 1️⃣ Executive Summary
This document outlines the backend development plan for MealPlanr, a personalized meal planning application. The backend will be built using FastAPI (Python 3.13) and will connect to a MongoDB Atlas database using Motor. The development will follow a dynamic sprint plan, with manual testing after every task. This plan adheres to the constraints of no Docker, a single `main` branch Git workflow, and an API base path of `/api/v1`.

### 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
  - User profile setup (dietary restrictions, budget).
  - Weekly meal plan generation based on user profile.
  - Ability to swap and remove meals from the plan.
  - Automatically generated shopping list based on the meal plan.
  - Ability to add, remove, and check off items from the shopping list.
- **Success Criteria:**
  - All frontend features are fully functional end-to-end with the live backend.
  - All task-level manual tests pass via the UI.
  - Each sprint's code is pushed to the `main` branch after successful verification.

### 3️⃣ API Design
- **Base Path:** `/api/v1`
- **Error Envelope:** `{ "error": "message" }`

---

- **Endpoint:** `POST /api/v1/auth/signup`
  - **Purpose:** Register a new user.
  - **Request Shape:** `{ "email": "user@example.com", "password": "password123" }`
  - **Response Shape:** `{ "access_token": "jwt_token", "token_type": "bearer" }`
  - **Validation:** Email must be valid and unique. Password must be securely hashed.

- **Endpoint:** `POST /api/v1/auth/login`
  - **Purpose:** Authenticate a user and issue a JWT.
  - **Request Shape:** Form data with `username` (email) and `password`.
  - **Response Shape:** `{ "access_token": "jwt_token", "token_type": "bearer" }`
  - **Validation:** Credentials must match a user in the database.

- **Endpoint:** `GET /api/v1/auth/me`
  - **Purpose:** Get the current authenticated user's details.
  - **Request Shape:** None (uses JWT from header).
  - **Response Shape:** `{ "id": "...", "email": "...", "profile": { ... } }`

- **Endpoint:** `PUT /api/v1/profile`
  - **Purpose:** Update the user's profile.
  - **Request Shape:** `{ "weeklyBudget": 75, "dietaryRestrictions": ["vegetarian"], "otherDietaryRestrictions": "..." }`
  - **Response Shape:** The updated profile object.

- **Endpoint:** `POST /api/v1/meal-plan/generate`
  - **Purpose:** Generate a new weekly meal plan for the user.
  - **Request Shape:** None.
  - **Response Shape:** The full `MealPlan` object.

- **Endpoint:** `GET /api/v1/meal-plan`
  - **Purpose:** Retrieve the current week's meal plan.
  - **Request Shape:** None.
  - **Response Shape:** The full `MealPlan` object.

- **Endpoint:** `POST /api/v1/meal-plan/swap`
  - **Purpose:** Swap a meal in the current plan.
  - **Request Shape:** `{ "day": "Monday", "mealType": "breakfast" }`
  - **Response Shape:** The updated `MealPlan` object.

- **Endpoint:** `POST /api/v1/meal-plan/remove`
  - **Purpose:** Remove a meal from the current plan.
  - **Request Shape:** `{ "day": "Monday", "mealType": "breakfast" }`
  - **Response Shape:** The updated `MealPlan` object.

- **Endpoint:** `POST /api/v1/shopping-list/item`
  - **Purpose:** Add an item to the shopping list.
  - **Request Shape:** `{ "item": "Milk", "quantity": "1 gallon" }`
  - **Response Shape:** The newly created `ShoppingListItem` object.

- **Endpoint:** `DELETE /api/v1/shopping-list/item/{item_id}`
  - **Purpose:** Remove an item from the shopping list.
  - **Request Shape:** None.
  - **Response Shape:** `204 No Content`.

- **Endpoint:** `PATCH /api/v1/shopping-list/item/{item_id}`
  - **Purpose:** Update an item in the shopping list (e.g., check it off).
  - **Request Shape:** `{ "checked": true }`
  - **Response Shape:** The updated `ShoppingListItem` object.

### 4️⃣ Data Model (MongoDB Atlas)
- **Collection:** `users`
  - `_id`: ObjectId (required)
  - `email`: String (required, unique)
  - `hashed_password`: String (required)
  - `profile`: Embedded Document (default: `{}`)
    - `weeklyBudget`: Number
    - `dietaryRestrictions`: Array of Strings
    - `otherDietaryRestrictions`: String
  - **Example:**
    ```json
    {
      "_id": "60c72b2f9b1e8b3b4c8b4567",
      "email": "test@example.com",
      "hashed_password": "...",
      "profile": {
        "weeklyBudget": 75,
        "dietaryRestrictions": ["vegetarian"]
      }
    }
    ```

- **Collection:** `meals`
  - `_id`: ObjectId (required)
  - `name`: String (required)
  - `portionSize`: String
  - `ingredients`: Array of Embedded Documents
    - `item`: String
    - `quantity`: String
  - `dietaryTags`: Array of Strings
  - **Example:**
    ```json
    {
      "_id": "60c72b2f9b1e8b3b4c8b4568",
      "name": "Lentil Soup",
      "portionSize": "4",
      "ingredients": [{"item": "Lentils", "quantity": "1 cup"}],
      "dietaryTags": ["vegan", "gluten-free"]
    }
    ```

- **Collection:** `meal_plans`
  - `_id`: ObjectId (required)
  - `userId`: ObjectId (required, ref: `users`)
  - `week`: String (required, e.g., "2025-W44")
  - `meals`: Array of Embedded Documents
    - `day`: String
    - `breakfast`: ObjectId (ref: `meals`)
    - `lunch`: ObjectId (ref: `meals`)
    - `dinner`: ObjectId (ref: `meals`)
  - `shoppingList`: Array of Embedded Documents
    - `id`: String (UUID)
    - `item`: String
    - `quantity`: String
    - `checked`: Boolean
  - **Example:**
    ```json
    {
      "_id": "60c72b2f9b1e8b3b4c8b4569",
      "userId": "60c72b2f9b1e8b3b4c8b4567",
      "week": "2025-W44",
      "meals": [{"day": "Monday", "breakfast": "60c72b2f9b1e8b3b4c8b4568"}],
      "shoppingList": [{"id": "uuid-123", "item": "Lentils", "quantity": "1 cup", "checked": false}]
    }
    ```

### 5️⃣ Frontend Audit & Feature Map
- **Component:** `UserProfileSetup.tsx`
  - **Purpose:** Onboard user by collecting dietary and budget info.
  - **Endpoint:** `PUT /api/v1/profile`
  - **Models:** `User`, `Profile`
  - **Auth:** Required.

- **Component:** `MealPlanGenerator.tsx`
  - **Purpose:** Main dashboard for viewing and managing the meal plan and shopping list.
  - **Endpoints:**
    - `POST /api/v1/meal-plan/generate`
    - `GET /api/v1/meal-plan`
    - `POST /api/v1/meal-plan/swap`
    - `POST /api/v1/meal-plan/remove`
    - `POST /api/v1/shopping-list/item`
    - `DELETE /api/v1/shopping-list/item/{item_id}`
    - `PATCH /api/v1/shopping-list/item/{item_id}`
  - **Models:** `MealPlan`, `Meal`, `ShoppingListItem`
  - **Auth:** Required.

### 6️⃣ Configuration & ENV Vars
- `APP_ENV`: `development` or `production`
- `PORT`: `8000`
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret key for signing JWTs.
- `JWT_EXPIRES_IN`: `1800` (30 minutes in seconds).
- `CORS_ORIGINS`: Frontend URL (e.g., `http://localhost:5173`).

### 7️⃣ Testing Strategy (Manual via Frontend)
- All validation will be performed through the frontend UI.
- Every task includes a **Manual Test Step** and a **User Test Prompt**.
- After all tasks in a sprint pass, the code will be committed and pushed to `main`.

### 8️⃣ Dynamic Sprint Plan & Backlog

---

### S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create a FastAPI skeleton with `/api/v1` and `/healthz`.
- Connect to MongoDB Atlas using `MONGODB_URI`.
- `/healthz` performs a DB ping and returns a JSON status.
- Enable CORS for the frontend.
- Replace dummy API URLs in the frontend with real backend URLs.
- Initialize Git at the root, set the default branch to `main`, and push to GitHub.
- Create a single `.gitignore` file at the root.

**Definition of Done:**
- Backend runs locally and connects to MongoDB Atlas.
- `/healthz` returns a success status.
- Frontend can successfully call the `/healthz` endpoint.
- The repository is live on GitHub on the `main` branch.

**Manual Test Step:**
- Run the backend, open the frontend, and check the browser's Network tab for a successful `200 OK` response from `/api/v1/healthz`.

**User Test Prompt:**
> "Start the backend and refresh the app. Confirm that the status shows a successful DB connection in the browser's developer console."

---

### S1 – Basic Auth & Profile Setup

**Objectives:**
- Implement JWT-based signup and login.
- Protect the profile and meal plan routes.
- Allow users to save their profile information.

**Tasks:**
- **Implement User Signup:**
  - Create the `POST /api/v1/auth/signup` endpoint.
  - Store the user in the `users` collection with a hashed password.
  - **Manual Test Step:** Use a UI form to sign up. A success message should be visible, and a JWT should be stored.
  - **User Test Prompt:** "Create a new account and verify you are logged in."

- **Implement User Login:**
  - Create the `POST /api/v1/auth/login` endpoint.
  - Issue a JWT upon successful authentication.
  - **Manual Test Step:** Log in via the UI. The user should be redirected to the main app page.
  - **User Test Prompt:** "Log in with your new account and confirm you are taken to the meal planner."

- **Implement Profile Update:**
  - Create the `PUT /api/v1/profile` endpoint.
  - Update the user's profile in the database.
  - **Manual Test Step:** Fill out and submit the profile setup form. The data should be saved and reflected in subsequent actions.
  - **User Test Prompt:** "Set your dietary preferences and budget, save the profile, and confirm the settings are saved."

**Definition of Done:**
- The full authentication and profile setup flow works end-to-end in the frontend.
- **Post-sprint:** Commit and push to `main`.

---

### S2 – Meal Plan Management

**Objectives:**
- Implement the core meal plan generation and management logic.
- Connect the meal plan features to the frontend UI.

**Tasks:**
- **Generate Meal Plan:**
  - Create the `POST /api/v1/meal-plan/generate` endpoint.
  - Implement logic to create a 7-day meal plan based on the user's profile.
  - **Manual Test Step:** Click the "Generate New Weekly Plan" button. A full 7-day meal plan should appear.
  - **User Test Prompt:** "Generate a new meal plan and verify that a full week of meals is displayed."

- **Swap and Remove Meals:**
  - Implement the `POST /api/v1/meal-plan/swap` and `POST /api/v1/meal-plan/remove` endpoints.
  - **Manual Test Step:** Use the swap and remove buttons on a meal card. The UI should update to show the new or removed meal.
  - **User Test Prompt:** "Swap a meal for a different one, then remove another meal. Confirm the UI updates correctly."

**Definition of Done:**
- Users can generate, swap, and remove meals, and the changes are reflected in the UI.
- **Post-sprint:** Commit and push to `main`.

---

### S3 – Shopping List Management

**Objectives:**
- Implement shopping list generation and management.
- Connect the shopping list features to the frontend UI.

**Tasks:**
- **Generate Shopping List:**
  - The shopping list should be generated and updated automatically whenever the meal plan changes.
  - **Manual Test Step:** After generating or modifying a meal plan, check the shopping list. It should contain the correct ingredients.
  - **User Test Prompt:** "After generating a meal plan, check the shopping list to ensure it's populated with ingredients."

- **Manage Shopping List Items:**
  - Implement the `POST`, `DELETE`, and `PATCH` endpoints for shopping list items.
  - **Manual Test Step:** Add a new item, check an item off, and delete an item using the UI controls. The list should update accordingly.
  - **User Test Prompt:** "Add a custom item to your shopping list, mark an item as complete, and then delete an item. Verify all actions work as expected."

**Definition of Done:**
- The shopping list is automatically generated and can be manually managed by the user through the UI.
- **Post-sprint:** Commit and push to `main`.