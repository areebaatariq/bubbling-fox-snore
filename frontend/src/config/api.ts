// API Configuration
// Use environment variable if set, otherwise default to production backend
// For local development, set VITE_API_URL=http://localhost:8000 in .env file
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://backend-demo-6apl.onrender.com";
export const API_URL = `${API_BASE_URL}/api/v1`;

