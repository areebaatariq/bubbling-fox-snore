// API Configuration
// In production, set VITE_API_URL environment variable
// For development, defaults to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_URL = `${API_BASE_URL}/api/v1`;

