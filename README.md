# Meal Plan Generator

This is a full-stack application that generates personalized meal plans based on user preferences. The frontend is built with React and the backend is a FastAPI server.

## Project Structure

-   `frontend/`: Contains the React frontend application.
-   `backend/`: Contains the FastAPI backend application.

## Getting Started

### Prerequisites

-   Node.js and npm
-   Python 3.13+ and pip

### Backend Setup

1.  Navigate to the `backend` directory:
    ```sh
    cd backend
    ```
2.  Install the required dependencies:
    ```sh
    pip install -r ../requirements.txt
    ```
3.  Run the development server:
    ```sh
    uvicorn main:app --reload
    ```

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```sh
    cd frontend
    ```
2.  Install the required dependencies:
    ```sh
    npm install
    ```
3.  Run the development server:
    ```sh
    npm run dev
    ```

The application will be available at `http://localhost:5173`.