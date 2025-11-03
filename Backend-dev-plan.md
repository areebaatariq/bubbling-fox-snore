# 1️⃣ Executive Summary

This document outlines the backend development plan for the MealPlanr application. The goal is to build a FastAPI backend with a MongoDB Atlas database to replace the current frontend's mock data and localStorage-based persistence.

The development will follow these constraints:
- **Backend:** FastAPI (Python 3.13, async)
- **Database:** MongoDB Atlas using Motor and Pydantic v2 models
- **No Docker**
- **Testing:** Manual testing after every task via the frontend
- **Git Workflow:** Single `main` branch

The plan is broken down into dynamic sprints (S0...Sn) to cover all frontend-visible features.

# 2️⃣ In-Scope & Success Criteria

- **In-Scope Features:**
  - User profile setup (dietary restrictions, budget)
  - User authentication (signup, login, logout)
  - Meal plan generation based on user profile
  - Meal swapping and removal
  - Shopping list generation from the meal plan
  - Shopping list item management (add, remove, toggle)

- **Success Criteria:**
  - All frontend features are fully functional and connected to the backend.
  - All task-level manual tests pass via the UI.
  - Each sprint's code is pushed to the `main` branch after verification.

# 3️⃣ API Design

- **Base Path:** `/api/v1`
- **Error Envelope:** `{ "error": "message" }`

---

### Auth Endpoints

- **`POST /auth/signup`**
  - **Purpose:** Register a new user.
  - **Request:** `{ "email": "user@example.com", "password": "password123" }`
  - **Response:** `{ "token": "jwt_token" }`
  - **Validation:** Email must be valid and unique. Password must be strong.

- **`POST /auth/login`**
  - **Purpose:** Log in an existing user.
  - **Request:** `{ "email": "user@example.com", "password": "password123" }`
  - **Response:** `{ "token": "jwt_token" }`

- **`GET /auth/me`**
  - **Purpose:** Get the current logged-in user's data.
  - **Request:** (Requires JWT in header)
  - **Response:** `{ "id": "...", "email": "...", "profile": { ... } }`

### User Profile Endpoints

- **`PUT /profile`**
  - **Purpose:** Create or update the user's profile.
  - **Request:** (Requires JWT) `{ "dietaryRestrictions": ["vegetarian"], "weeklyBudget": 75, "otherDietaryRestrictions": "No peanuts" }`
  - **Response:** The updated user profile object.

### Meal Plan Endpoints

- **`POST /meal-plan/generate`**
  - **Purpose:** Generate a new weekly meal plan for the user.
  - **Request:** (Requires JWT)
  - **Response:** The generated meal plan object.

- **`GET /meal-plan`**
  - **Purpose:** Get the current user's meal plan.
  - **Request:** (Requires JWT)
  - **Response:** The current meal plan object.

- **`PUT /meal-plan`**
    - **Purpose:** Update the user's meal plan (e.g., swap/remove a meal).
    - **Request:** (Requires JWT) The updated meal plan object.
    - **Response:** The updated meal plan object.

### Shopping List Endpoints

- **`GET /shopping-list`**
    - **Purpose:** Get the user's shopping list.
    - **Request:** (Requires JWT)
    - **Response:** The shopping list array.

- **`PUT /shopping-list`**
    - **Purpose:** Update the user's shopping list (add, remove, toggle items).
    - **Request:** (Requires JWT) The updated shopping list array.
    - **Response:** The updated shopping list array.

# 4️⃣ Data Model (MongoDB Atlas)

### `users` collection
- `_id`: ObjectId (auto-generated)
- `email`: string (required, unique)
- `password`: string (required, hashed)
- `profile`:
    - `dietaryRestrictions`: array of strings
    - `weeklyBudget`: number
    - `otherDietaryRestrictions`: string
- **Example:**
  ```json
  {
    "_id": "ObjectId('...')",
    "email": "test@example.com",
    "password": "hashed_password",
    "profile": {
      "dietaryRestrictions": ["vegetarian"],
      "weeklyBudget": 50,
      "otherDietaryRestrictions": ""
    }
  }
  ```

### `meals` collection
- `_id`: ObjectId (auto-generated)
- `name`: string (required)
- `recipe`: string
- `ingredients`: array of embedded objects (`{ "item": "Tofu", "quantity": "1 block" }`)
- `portionSize`: number
- `tags`: array of strings (e.g., "vegetarian", "gluten-free")
- **Example:**
  ```json
  {
    "_id": "ObjectId('...')",
    "name": "Vegetable Stir-fry with Tofu",
    "recipe": "...",
    "ingredients": [{"item": "Tofu", "quantity": "1 block"}],
    "portionSize": 2,
    "tags": ["vegetarian", "vegan"]
  }
  ```

### `meal_plans` collection
- `_id`: ObjectId (auto-generated)
- `userId`: ObjectId (reference to `users`)
- `week`: string
- `meals`: array of objects (`{ "day": "Monday", "breakfast": ObjectId, "lunch": ObjectId, "dinner": ObjectId }`)
- **Example:**
  ```json
  {
    "_id": "ObjectId('...')",
    "userId": "ObjectId('...')",
    "week": "Current Week",
    "meals": [
      { "day": "Monday", "breakfast": "ObjectId('...')", "lunch": "ObjectId('...')", "dinner": "ObjectId('...')" }
    ]
  }
  ```

### `shopping_lists` collection
- `_id`: ObjectId (auto-generated)
- `userId`: ObjectId (reference to `users`)
- `items`: array of objects (`{ "id": "uuid", "item": "Milk", "quantity": "1 gallon", "store": "Local Grocer", "price": 3.50, "checked": false }`)
- **Example:**
  ```json
  {
    "_id": "ObjectId('...')",
    "userId": "ObjectId('...')",
    "items": [
      { "id": "...", "item": "Milk", "quantity": "1 gallon", "store": "Local Grocer", "price": 3.50, "checked": false }
    ]
  }
  ```

# 5️⃣ Frontend Audit & Feature Map

- **`UserProfileSetup.tsx`**
  - **Purpose:** Onboard user by collecting dietary preferences and budget.
  - **Data Needed:** User profile data.
  - **Endpoint(s):** `PUT /api/v1/profile`
  - **Model(s):** `users` (embedded profile)
  - **Auth:** Required.

- **`MealPlanGenerator.tsx`**
  - **Purpose:** Display and manage the weekly meal plan and shopping list.
  - **Data Needed:** Meal plan, shopping list, available meals.
  - **Endpoint(s):** `GET /api/v1/meal-plan`, `POST /api/v1/meal-plan/generate`, `PUT /api/v1/meal-plan`, `GET /api/v1/shopping-list`, `PUT /api/v1/shopping-list`
  - **Model(s):** `meal_plans`, `shopping_lists`, `meals`
  - **Auth:** Required.

# 6️⃣ Configuration & ENV Vars

- `APP_ENV`: `development` or `production`
- `PORT`: `8000`
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: A long, random string for signing JWTs
- `JWT_EXPIRES_IN`: `86400` (24 hours in seconds)
- `CORS_ORIGINS`: The frontend URL (e.g., `http://localhost:5173`)

# 7️⃣ Background Work

- None required for the MVP.

# 8️⃣ Integrations

- None required for the MVP.

# 9️⃣ Testing Strategy (Manual via Frontend)

- All backend functionality will be validated by interacting with the frontend UI.
- Every task in the sprint plan includes a **Manual Test Step** and a **User Test Prompt**.
- After all tasks in a sprint are completed and tested, the code will be committed and pushed to the `main` branch.

# 🔟 Dynamic Sprint Plan & Backlog

---

## S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create a basic FastAPI application with `/api/v1` base path and a `/healthz` endpoint.
- Connect to MongoDB Atlas using the `MONGODB_URI`.
- The `/healthz` endpoint should perform a database ping.
- Enable CORS for the frontend URL.
- Initialize a Git repository, set the default branch to `main`, and create a `.gitignore` file.

**Definition of Done:**
- The backend runs locally and successfully connects to MongoDB Atlas.
- The `/healthz` endpoint returns a success status.
- The frontend can make requests to the backend.
- The repository is on GitHub with the initial setup in the `main` branch.

**Manual Test Step:**
- Run the backend, open the frontend, and check the browser's Network tab. The call to `/healthz` should return a 200 OK status with a success message.

**User Test Prompt:**
> "Start the backend and refresh the app. Confirm that the network tab shows a successful call to the `/healthz` endpoint."

---

## S1 – Basic Auth (Signup / Login) & Profile Setup

**Objectives:**
- Implement JWT-based signup and login.
- Store user data in the `users` collection with a hashed password.
- Create an endpoint to get the current user's data (`/auth/me`).
- Create an endpoint to save/update the user's profile.
- Protect the profile and meal plan pages on the frontend.

**Tasks:**
- **Implement `POST /auth/signup`:**
  - **Manual Test Step:** Use a tool like Postman or curl to create a new user. Check the database to confirm the user was created with a hashed password.
  - **User Test Prompt:** "Create a new user account using an API client and verify it's in the database."

- **Implement `POST /auth/login`:**
  - **Manual Test Step:** Use an API client to log in with the new user. A JWT should be returned.
  - **User Test Prompt:** "Log in with the created user via an API client and confirm you receive a JWT."

- **Implement `GET /auth/me` and `PUT /profile`:**
  - **Manual Test Step:** Use the JWT from login to fetch the user's data and then update their profile.
  - **User Test Prompt:** "Using the JWT, fetch the user's data and then update their profile information."

- **Integrate Auth and Profile with Frontend:**
  - **Manual Test Step:** Replace the frontend's `localStorage` logic for profile management with API calls to the backend. The app should now require login to see the meal planner.
  - **User Test Prompt:** "The app should now require you to log in. After logging in, your profile information should be fetched from the backend."

**Definition of Done:**
- Users can sign up, log in, and have their session managed with JWTs.
- User profile data is persisted in the database.
- The frontend uses the backend for authentication and profile management.

**Post-sprint:**
- Commit and push to `main`.

---

## S2 – Meal and Meal Plan Management

**Objectives:**
- Create a `meals` collection and populate it with the mock meal data.
- Implement the `POST /meal-plan/generate` endpoint to create a meal plan based on the user's profile.
- Implement `GET /meal-plan` to retrieve the user's current meal plan.
- Implement `PUT /meal-plan` to handle swapping and removing meals.

**Tasks:**
- **Seed the `meals` collection:**
  - **Manual Test Step:** Write a script to insert the mock meal data into the `meals` collection in MongoDB. Verify the data in the Atlas UI.
  - **User Test Prompt:** "Run the seeding script and confirm the meals are present in the database."

- **Implement Meal Plan Generation and Retrieval:**
  - **Manual Test Step:** Log in to the frontend and click "Generate New Weekly Plan". The plan should be generated and displayed, and the data should be saved in the `meal_plans` collection. Refreshing the page should show the same plan.
  - **User Test Prompt:** "Generate a meal plan. It should appear on the screen and persist after a page refresh."

- **Implement Meal Swapping/Removal:**
  - **Manual Test Step:** In the frontend, swap a meal and remove another. The changes should be reflected on the screen and updated in the database.
  - **User Test Prompt:** "Swap and remove meals from your plan. The changes should be saved and persist."

**Definition of Done:**
- The backend can generate and serve meal plans based on user preferences.
- The frontend is fully integrated with the meal plan endpoints.

**Post-sprint:**
- Commit and push to `main`.

---

## S3 – Shopping List Management

**Objectives:**
- When a meal plan is generated, also generate a shopping list and save it.
- Implement `GET /shopping-list` to retrieve the user's shopping list.
- Implement `PUT /shopping-list` to handle adding, removing, and toggling items.

**Tasks:**
- **Implement Shopping List Generation:**
  - **Manual Test Step:** When a meal plan is generated in the frontend, a corresponding shopping list should be created in the `shopping_lists` collection.
  - **User Test Prompt:** "Generate a new meal plan and verify that a shopping list is created for it in the database."

- **Implement Shopping List Updates:**
  - **Manual Test Step:** In the frontend, add a new item to the shopping list, remove an item, and check/uncheck an item. All changes should be persisted in the database and reflected after a page refresh.
  - **User Test Prompt:** "Modify your shopping list (add, remove, check items). The changes should be saved and persist."

**Definition of Done:**
- The shopping list is automatically generated with the meal plan.
- All shopping list modifications in the frontend are saved to the backend.

**Post-sprint:**
- Commit and push to `main`.